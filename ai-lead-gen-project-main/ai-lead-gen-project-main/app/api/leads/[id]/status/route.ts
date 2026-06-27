import { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify'
import { LeadManagementService } from '@/lib/services/lead-management.service'
import { successResponse, unauthorizedResponse, internalErrorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api-response'
import { ZodError } from 'zod'
import { z } from 'zod'

const statusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = await verifyAuth(request).catch(() => null)
    if (!decoded) {
      return unauthorizedResponse('Invalid token')
    }

    const body = await request.json()

    // Validate input
    let validatedData
    try {
      validatedData = statusSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(error.flatten().fieldErrors as Record<string, string[]>)
      }
      throw error
    }

    // trackActivity advances the lead status AND records LeadStatusHistory
    // when the status actually changes.
    await LeadManagementService.trackActivity(decoded.id, params.id, null, validatedData.status)
    const lead = await LeadManagementService.getLead(decoded.id, params.id)

    return successResponse({ lead }, 'Lead status updated successfully')
  } catch (error: any) {
    if (error.message === 'Lead not found' || error.message === 'Lead not found or unauthorized') {
      return notFoundResponse('Lead not found')
    }
    console.error('Change status error:', error)
    return internalErrorResponse('Failed to update lead status')
  }
}
