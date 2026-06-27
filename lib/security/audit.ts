import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  OAUTH_LOGIN = 'OAUTH_LOGIN',
  ACCOUNT_LINK = 'ACCOUNT_LINK',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  SESSION_REFRESH = 'SESSION_REFRESH',
}

interface AuditLogParams {
  userId?: string
  action: AuditAction
  entityType: string
  entityId?: string
  oldValue?: string
  newValue?: string
  request?: NextRequest
  metadata?: Record<string, unknown>
}

export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
  request,
  metadata,
}: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        ipAddress: request ? getClientIp(request) : undefined,
        userAgent: request ? request.headers.get('user-agent') || undefined : undefined,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const xRealIp = request.headers.get('x-real-ip')
  return (forwarded?.split(',')[0] || xRealIp || (request as any).ip || 'unknown').trim()
}

export async function getAuditLogs(
  filters?: {
    userId?: string
    action?: AuditAction
    startDate?: Date
    endDate?: Date
  },
  limit: number = 100,
  offset: number = 0
) {
  const where: any = {}

  if (filters?.userId) where.userId = filters.userId
  if (filters?.action) where.action = filters.action
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}
    if (filters?.startDate) where.createdAt.gte = filters.startDate
    if (filters?.endDate) where.createdAt.lte = filters.endDate
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}
