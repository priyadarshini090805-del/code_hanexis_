import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export interface BruteForceCheckResult {
  allowed: boolean
  attemptsRemaining: number
  lockedUntil?: Date
  message?: string
}

export async function checkBruteForce(
  email: string,
  ipAddress: string
): Promise<BruteForceCheckResult> {
  const attempt = await prisma.failedLoginAttempt.findUnique({
    where: {
      email_ipAddress: {
        email,
        ipAddress,
      },
    },
  })

  // Check if account is locked
  if (attempt && attempt.lockedUntil && attempt.lockedUntil > new Date()) {
    const minutesRemaining = Math.ceil(
      (attempt.lockedUntil.getTime() - Date.now()) / 60000
    )
    return {
      allowed: false,
      attemptsRemaining: 0,
      lockedUntil: attempt.lockedUntil,
      message: `Account temporarily locked. Try again in ${minutesRemaining} minutes.`,
    }
  }

  // Reset attempt if lockout has expired
  if (attempt && attempt.lockedUntil && attempt.lockedUntil <= new Date()) {
    await prisma.failedLoginAttempt.delete({
      where: { id: attempt.id },
    })
    return {
      allowed: true,
      attemptsRemaining: MAX_ATTEMPTS,
    }
  }

  // Return current status
  const attemptsRemaining = attempt ? MAX_ATTEMPTS - attempt.attemptCount : MAX_ATTEMPTS
  return {
    allowed: attemptsRemaining > 0,
    attemptsRemaining: Math.max(0, attemptsRemaining),
  }
}

export async function recordFailedLogin(
  email: string,
  ipAddress: string
): Promise<void> {
  const attempt = await prisma.failedLoginAttempt.findUnique({
    where: {
      email_ipAddress: {
        email,
        ipAddress,
      },
    },
  })

  if (!attempt) {
    // First attempt
    await prisma.failedLoginAttempt.create({
      data: {
        email,
        ipAddress,
        attemptCount: 1,
        lockedUntil: null,
      },
    })
  } else {
    const newAttemptCount = attempt.attemptCount + 1

    if (newAttemptCount >= MAX_ATTEMPTS) {
      // Lock account
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION)
      await prisma.failedLoginAttempt.update({
        where: { id: attempt.id },
        data: {
          attemptCount: newAttemptCount,
          lockedUntil,
        },
      })
    } else {
      // Increment attempt counter
      await prisma.failedLoginAttempt.update({
        where: { id: attempt.id },
        data: {
          attemptCount: newAttemptCount,
        },
      })
    }
  }
}

export async function clearFailedLogins(email: string, ipAddress: string): Promise<void> {
  try {
    await prisma.failedLoginAttempt.delete({
      where: {
        email_ipAddress: {
          email,
          ipAddress,
        },
      },
    })
  } catch {
    // No record to delete, ignore
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const xRealIp = request.headers.get('x-real-ip')
  return (forwarded?.split(',')[0] || xRealIp || (request as any).ip || 'unknown').trim()
}

export async function cleanupExpiredLockouts(): Promise<number> {
  const result = await prisma.failedLoginAttempt.deleteMany({
    where: {
      lockedUntil: {
        lt: new Date(),
      },
    },
  })
  return result.count
}
