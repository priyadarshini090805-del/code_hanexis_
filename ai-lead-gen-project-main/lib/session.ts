import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export interface SessionInfo {
  id: string
  userId: string
  sessionToken: string
  userAgent?: string | null
  ipAddress?: string | null
  expiresAt: Date
  rememberMe: boolean
  createdAt: Date
  updatedAt: Date
}

export async function getSessionById(sessionId: string): Promise<SessionInfo | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  })
  return session
}

export async function getUserSessions(userId: string): Promise<SessionInfo[]> {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return sessions
}

export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.session.delete({
    where: { id: sessionId },
  })
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  })
}

export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })
  return result.count
}

export async function extendSession(
  sessionId: string,
  expiresAt: Date
): Promise<SessionInfo | null> {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: { expiresAt },
  })
  return session
}

export async function getCurrentSession(): Promise<SessionInfo | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('accessToken')?.value

  if (!sessionToken) {
    return null
  }

  // Parse session token (format: accessToken|refreshToken)
  const [accessToken] = sessionToken.split('|')

  const session = await prisma.session.findUnique({
    where: { sessionToken: accessToken },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session
}

export async function validateSession(sessionToken: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
  })

  if (!session) return false
  if (session.expiresAt < new Date()) return false

  return true
}

export async function revokeAllDeviceSessions(userId: string, exceptSessionId?: string): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      userId,
      id: exceptSessionId ? { not: exceptSessionId } : undefined,
    },
  })
}

export async function getSessionMetrics(userId: string) {
  const activeSessions = await prisma.session.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
  })

  const lastLogin = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastLoginAt: true, lastLoginIp: true },
  })

  return {
    activeSessionCount: activeSessions.length,
    sessions: activeSessions,
    lastLogin: lastLogin?.lastLoginAt,
    lastLoginIp: lastLogin?.lastLoginIp,
  }
}
