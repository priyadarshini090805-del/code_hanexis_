import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const xRealIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || xRealIp || (request as any).ip || 'unknown'
  return ip
}

export interface DbRateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * Production-ready, serverless-safe rate limit keyed by client IP + scope.
 * Backed by the RateLimitCounter table (shared across all serverless
 * invocations), unlike in-memory Map limiters which reset per-invocation.
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
