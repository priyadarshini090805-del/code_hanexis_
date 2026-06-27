import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  verifyTwoFactorToken,
  generateAccessToken,
  generateRefreshToken,
} from '@/lib/auth/crypto'
import {
  successResponse,
  unauthorizedResponse,
  internalErrorResponse,
} from '@/lib/api-response'
import { createAuditLog, AuditAction } from '@/lib/security/audit'
import { verifyTOTP } from '@/lib/auth/totp'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { twoFactorToken, totpCode } = body as {
      twoFactorToken: string
      totpCode: string
    }

    if (!twoFactorToken || !totpCode) {
      return unauthorizedResponse('Missing twoFactorToken or totpCode')
    }

    if (!/^\d{6}$/.test(totpCode)) {
      return unauthorizedResponse('TOTP code must be a 6-digit number')
    }

    const pending = verifyTwoFactorToken(twoFactorToken)
    if (!pending) {
      return unauthorizedResponse('Invalid or expired two-factor token')
    }

    const user = await prisma.user.findUnique({
      where: { id: pending.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    })

    if (!user || !user.isActive) {
      return unauthorizedResponse('User not found or inactive')
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return unauthorizedResponse('2FA is not enabled for this user')
    }

    const valid = verifyTOTP(user.twoFactorSecret, totpCode)
    if (!valid) {
      return unauthorizedResponse('Invalid or expired TOTP code')
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    })

    const cookieStore = await cookies()
    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    })
    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    await createAuditLog({
      userId: user.id,
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: user.id,
      request,
      metadata: { event: '2FA verified, login complete' },
    })

    return successResponse(
      {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      },
      'Login successful'
    )
  } catch (error) {
    console.error('2FA login-verify error:', error)
    return internalErrorResponse('2FA verification failed')
  }
}
