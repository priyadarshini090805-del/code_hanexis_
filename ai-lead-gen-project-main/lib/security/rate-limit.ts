import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (in production, use Redis)
const rateLimitStore: Map<string, RateLimitEntry> = new Map()

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number // in milliseconds
}

export const RATE_LIMIT_PRESETS = {
  STRICT: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 requests per minute
  MODERATE: { maxRequests: 15, windowMs: 60 * 1000 }, // 15 requests per minute
  RELAXED: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 requests per minute
  AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  API: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
}

export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const xRealIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || xRealIp || (request as any).ip || 'unknown'
  return ip
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetTime) {
    // Create new entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  // Increment count
  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

export function rateLimitMiddleware(config: RateLimitConfig) {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      const identifier = getClientIdentifier(request)
      const { allowed, remaining, resetTime } = checkRateLimit(identifier, config)

      if (!allowed) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Too many requests. Please try again later.',
          }),
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
              'X-RateLimit-Limit': String(config.maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(resetTime),
            },
          }
        )
      }

      // Add rate limit headers to response
      const response = await handler(request)
      response.headers.set('X-RateLimit-Limit', String(config.maxRequests))
      response.headers.set('X-RateLimit-Remaining', String(remaining))
      response.headers.set('X-RateLimit-Reset', String(resetTime))

      return response
    }
  }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 1000) // Clean up every minute

// ---------------------------------------------------------------------------
// Distributed, DB-backed rate limiter (host-agnostic; correct on serverless).
// Prefer this over the in-memory checkRateLimit above for anything that must
// hold across instances (auth, AI spend, etc.).
// ---------------------------------------------------------------------------
import { prisma } from '@/lib/prisma'

export interface DbRateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * Production-ready, serverless-safe rate limit keyed by client IP + scope.
 * Backed by the RateLimitCounter table (shared across all serverless
 * invocations), unlike the in-memory Map limiters which reset per-invocation.
 */
export async function enforceRequestRateLimit(
  request: NextRequest,
  scope: string,
  maxRequests: number,
  windowMs: number
): Promise<DbRateLimitResult> {
  const id = getClientIdentifier(request)
  return enforceRateLimit(`${scope}:${id}`, maxRequests, windowMs)
}

export async function enforceRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<DbRateLimitResult> {
  const now = new Date()
  const existing = await prisma.rateLimitCounter.findUnique({ where: { key } })

  if (!existing || existing.resetAt <= now) {
    const resetAt = new Date(now.getTime() + windowMs)
    await prisma.rateLimitCounter.upsert({
      where: { key },
      update: { count: 1, resetAt },
      create: { key, count: 1, resetAt },
    })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  const updated = await prisma.rateLimitCounter.update({
    where: { key },
    data: { count: { increment: 1 } },
  })
  return { allowed: true, remaining: Math.max(0, maxRequests - updated.count), resetAt: existing.resetAt }
}
