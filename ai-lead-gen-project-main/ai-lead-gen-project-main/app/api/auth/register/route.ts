import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/crypto'
import { resolveRole } from '@/lib/auth/roles'
import { registerSchema } from '@/lib/validations/auth'
import { validationErrorResponse, successResponse, conflictResponse, internalErrorResponse, tooManyRequestsResponse } from '@/lib/api-response'
import { csrfMiddleware } from '@/lib/security/csrf'
import { enforceRequestRateLimit } from '@/lib/security/rate-limit'
import { createAuditLog, AuditAction } from '@/lib/security/audit'
import { ZodError } from 'zod'

async function handler(request: NextRequest) {
  try {
    // Note: CSRF already validated by csrfMiddleware wrapper — do not call it again here.

    // DB-backed, serverless-safe rate limit: max 5 signups/min per IP.
    const rl = await enforceRequestRateLimit(request, 'auth:register', 5, 60_000)
    if (!rl.allowed) {
      return tooManyRequestsResponse('Too many registration attempts. Please try again later.')
    }

    const body = await request.json()

    // Validate input
    let validatedData
    try {
      validatedData = registerSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.flatten().fieldErrors
        return validationErrorResponse(
          errors as Record<string, string[]>
        )
      }
      throw error
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return conflictResponse('Email already in use')
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        passwordHash,
        role: resolveRole(validatedData.email),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    // Log registration
    await createAuditLog({
      userId: user.id,
      action: AuditAction.REGISTER,
      entityType: 'User',
      entityId: user.id,
      request,
    })

    return successResponse(
      { user },
      'Account created successfully',
      201
    )
  } catch (error) {
    console.error('Registration error:', error)
    return internalErrorResponse('Failed to create account')
  }
}

export const POST = csrfMiddleware(handler)
