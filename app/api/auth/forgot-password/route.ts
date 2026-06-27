import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { validationErrorResponse, successResponse, notFoundResponse, internalErrorResponse, tooManyRequestsResponse } from '@/lib/api-response'
import { generatePasswordResetToken } from '@/lib/auth/crypto'
import { createAuditLog, AuditAction } from '@/lib/security/audit'
import { enforceRequestRateLimit } from '@/lib/security/rate-limit'
import { sendEmail, getPasswordResetEmailTemplate } from '@/lib/email'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // DB-backed, serverless-safe: max 5 reset requests/min per IP.
    const rl = await enforceRequestRateLimit(request, 'auth:forgot', 5, 60_000)
    if (!rl.allowed) {
      return tooManyRequestsResponse('Too many requests. Please try again later.')
    }

    const body = await request.json()

    // Validate input
    let validatedData
    try {
      validatedData = forgotPasswordSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.flatten().fieldErrors
        return validationErrorResponse(
          errors as Record<string, string[]>
        )
      }
      throw error
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      // Don't reveal if user exists (security best practice)
      return successResponse(null, 'If the email exists, a reset link has been sent')
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken()

    // Save token to database
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        type: 'password-reset',
        expiresAt,
      },
    })

    // Log the action
    await createAuditLog({
      userId: user.id,
      action: AuditAction.PASSWORD_RESET,
      entityType: 'User',
      entityId: user.id,
      request,
    })

    // Send email with reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset Your Password - HaneXes',
        html: getPasswordResetEmailTemplate(user.firstName, resetLink),
      })
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Don't fail the request if email fails - token is still valid
    }

    return successResponse(null, 'If the email exists, a reset link has been sent')
  } catch (error) {
    console.error('Forgot password error:', error)
    return internalErrorResponse('Failed to process password reset request')
  }
}
