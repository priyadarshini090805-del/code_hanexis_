import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/crypto'
import { verifyAuth } from '@/lib/auth/verify'
import { aiService } from '@/lib/ai/service'
import { prisma } from '@/lib/prisma'
import { successResponse, unauthorizedResponse, validationErrorResponse, internalErrorResponse } from '@/lib/api-response'
import { createAuditLog, AuditAction } from '@/lib/security/audit'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import { tooManyRequestsResponse } from '@/lib/api-response'
import { z } from 'zod'
import { ZodError } from 'zod'

const generateMessageSchema = z.object({
  leadId: z.string().min(1),
  messageType: z.enum(['CONNECTION_MESSAGE', 'FOLLOWUP_MESSAGE', 'SALES_PITCH', 'COLD_OUTREACH', 'CALL_INVITATION', 'REENGAGEMENT']),
  tone: z.enum(['PROFESSIONAL', 'FRIENDLY', 'CONSULTATIVE', 'DIRECT', 'EXECUTIVE']),
  length: z.enum(['SHORT', 'MEDIUM', 'LONG']),
  productName: z.string().min(1),
  valueProposition: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    // Verify token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    const decoded = await verifyAuth(request).catch(() => null)
    if (!decoded) {
      return unauthorizedResponse('Invalid token')
    }

    // Distributed rate limit: max 20 AI generations per user per minute.
    const rl = await enforceRateLimit(`ai:generate:${decoded.id}`, 20, 60_000)
    if (!rl.allowed) {
      return tooManyRequestsResponse('Too many AI requests. Please slow down and try again shortly.')
    }

    // Parse and validate request body
    const body = await request.json()
    let validatedData
    try {
      validatedData = generateMessageSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.flatten().fieldErrors
        return validationErrorResponse(errors as Record<string, string[]>)
      }
      throw error
    }

    // Fetch lead data
    const lead = await prisma.lead.findUnique({
      where: { id: validatedData.leadId },
      include: {
        tags: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    })

    if (!lead) {
      return validationErrorResponse({ leadId: ['Lead not found'] })
    }

    // Verify user owns the lead
    if (lead.userId !== decoded.id) {
      return unauthorizedResponse('You do not have permission to access this lead')
    }

    // Generate message using AI service
    const result = await aiService.generateMessage(
      decoded.id,
      validatedData.leadId,
      validatedData.messageType as any,
      validatedData.tone as any,
      validatedData.length as any,
      {
        firstName: lead.firstName,
        lastName: lead.lastName,
        company: lead.company || undefined,
        jobTitle: lead.jobTitle || undefined,
        notes: lead.notes || undefined,
        tags: lead.tags.map(t => t.name),
      },
      validatedData.productName,
      validatedData.valueProposition
    )

    // Log the action
    await createAuditLog({
      userId: decoded.id,
      action: AuditAction.PROFILE_UPDATE,
      entityType: 'AIGeneration',
      entityId: validatedData.leadId,
      newValue: JSON.stringify({
        messageType: validatedData.messageType,
        tone: validatedData.tone,
        length: validatedData.length,
        provider: 'openai',
      }),
      request,
    })

    if (!result.success) {
      return internalErrorResponse(result.error || 'Failed to generate message')
    }

    return successResponse(
      {
        message: result.message,
        tokensUsed: result.tokensUsed,
      },
      'Message generated successfully'
    )
  } catch (error) {
    console.error('Generate message error:', error)
    return internalErrorResponse('Failed to generate message')
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    const decoded = await verifyAuth(request).catch(() => null)
    if (!decoded) {
      return unauthorizedResponse('Invalid token')
    }

    // Get usage and history
    const usage = await aiService.getUsage(decoded.id)
    const history = await aiService.getGenerationHistory(decoded.id, undefined, 10)

    return successResponse(
      {
        usage,
        history,
      },
      'AI data retrieved'
    )
  } catch (error) {
    console.error('Get AI data error:', error)
    return internalErrorResponse('Failed to retrieve AI data')
  }
}
