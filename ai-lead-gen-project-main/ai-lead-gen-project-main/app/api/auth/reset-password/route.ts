import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { validationErrorResponse, successResponse, unauthorizedResponse, internalErrorResponse, tooManyRequestsResponse } from '@/lib/api-response'
import { hashPassword } from '@/lib/auth/crypto'
import { createAuditLog, AuditAction } from '@/lib/security/audit'
import { enforceRequestRateLimit } from '@/lib/security/rate-limit'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // DB-backed, serverless-safe: max 10 reset attempts/min per IP.
    const rl = await enforceRequestRateLimit(request, 'auth:reset', 10, 60_000)
    if (!rl.allowed) {
      return tooManyRequestsResponse('Too many attempts. Please try again later.')
    }

    const body = await request.json()

    // Validate input
    let validatedData
    try {
      validatedData = resetPasswordSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.flatten().fieldErrors
        return validationErrorResponse(
          errors as Record<string, string[]>
        )
      }
      throw error
    }

    // Find and validate token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: validatedData.token },
      include: { user: true },
    })

    if (!verificationToken) {
      return unauthorizedResponse('Invalid reset token')
    }

    // Check if token has expired
    if (new Date() > verificationToken.expiresAt) {
      return unauthorizedResponse('Reset token has expired')
    }

    // Check if token has already been used
    if (verificationToken.usedAt) {
      return unauthorizedResponse('Reset token has already been used')
    }

    // Check token type
    if (verificationToken.type !== 'password-reset') {
      return unauthorizedResponse('Invalid token type')
    }

    // Hash new password
    const passwordHash = await hashPassword(validatedData.password)

    // Update user password and mark token as used
    const user = verificationToken.user
    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens
      prisma.refreshToken.updateMany({
        where: { userId: user.id },
        data: { revokedAt: new Date() },
      }),
      // Delete all sessions
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ])

    // Log the action
    await createAuditLog({
      userId: user.id,
      action: AuditAction.PASSWORD_CHANGE,
      entityType: 'User',
      entityId: user.id,
      request,
    })

    return successResponse(null, 'Password reset successfully. Please log in with your new password.')
  } catch (error) {
    console.error('Reset password error:', error)
    return internalErrorResponse('Failed to reset password')
  }
}
