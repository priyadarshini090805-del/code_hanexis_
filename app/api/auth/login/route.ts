import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateAccessToken, generateRefreshToken, generateTwoFactorToken } from '@/lib/auth/crypto'
import { loginSchema } from '@/lib/validations/auth'
import { validationErrorResponse, successResponse, unauthorizedResponse, internalErrorResponse, tooManyRequestsResponse } from '@/lib/api-response'
import { csrfMiddleware } from '@/lib/security/csrf'
import { createAuditLog, AuditAction } from '@/lib/security/audit'
import { checkBruteForce, recordFailedLogin, clearFailedLogins, getClientIp } from '@/lib/security/brute-force'
import { ZodError } from 'zod'
import { cookies } from 'next/headers'

async function handler(request: NextRequest) {
  try {
    // Note: CSRF is already validated by csrfMiddleware (wraps this handler).
    // Do NOT call validateCSRFRequest again here — it would try to re-read the body.

    const body = await request.json()
    const ipAddress = getClientIp(request)

    // Validate input
    let validatedData
    try {
      validatedData = loginSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.flatten().fieldErrors
        return validationErrorResponse(
          errors as Record<string, string[]>
        )
      }
      throw error
    }

    // Check brute force protection
    const bruteForceCheck = await checkBruteForce(validatedData.email, ipAddress)
    if (!bruteForceCheck.allowed) {
      return tooManyRequestsResponse(
        bruteForceCheck.message || 'Too many login attempts. Please try again later.'
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
        isActive: true,
        firstName: true,
        lastName: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    })

    if (!user || !user.passwordHash) {
      // Record failed login attempt
      await recordFailedLogin(validatedData.email, ipAddress)

      await createAuditLog({
        action: AuditAction.LOGIN,
        entityType: 'User',
        entityId: validatedData.email,
        request,
      })
      return unauthorizedResponse('Invalid email or password')
    }

    // Check if user is active
    if (!user.isActive) {
      return unauthorizedResponse('Account is disabled')
    }

    // Verify password
    const isPasswordValid = await verifyPassword(validatedData.password, user.passwordHash)
    if (!isPasswordValid) {
      // Record failed login attempt
      await recordFailedLogin(validatedData.email, ipAddress)

      await createAuditLog({
        userId: user.id,
        action: AuditAction.LOGIN,
        entityType: 'User',
        entityId: user.id,
        request,
      })
      return unauthorizedResponse('Invalid email or password')
    }

    // Clear failed login attempts on successful login
    await clearFailedLogins(validatedData.email, ipAddress)

    // 2FA check: if enabled, return a challenge instead of full tokens
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const twoFactorToken = generateTwoFactorToken(user.id)

      await createAuditLog({
        userId: user.id,
        action: AuditAction.LOGIN,
        entityType: 'User',
        entityId: user.id,
        request,
        metadata: { event: '2FA challenge issued' },
      })

      return successResponse(
        {
          requiresTwoFactor: true,
          twoFactorToken,
        },
        'Two-factor authentication required'
      )
    }

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // Save refresh token to database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    })

    // Create session
    const sessionToken = `${accessToken}|${refreshToken}`
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.session.create({
      data: {
        userId: user.id,
        sessionToken,
        expiresAt: sessionExpiresAt,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
        rememberMe: validatedData.rememberMe,
      },
    })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    })

    // Set secure cookies
    const cookieStore = await cookies()
    const maxAge = validatedData.rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60 // 7 days or 24 hours

    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    })

    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // Always 7 days
      path: '/',
    })

    // Log successful login
    await createAuditLog({
      userId: user.id,
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: user.id,
      request,
    })

    return successResponse(
      {
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
    console.error('Login error:', error)
    return internalErrorResponse('Login failed')
  }
}

export const POST = csrfMiddleware(handler)
