import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { LeadManagementService } from '@/lib/services/lead-management.service';
import { z } from 'zod';

const updateLeadSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  company: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  jobTitle: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  status: z.string().optional(),
}).passthrough();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;

    const lead = await LeadManagementService.getLead(payload.id, id);
    return successResponse(lead);
  } catch (error: any) {
    return errorResponse(error.message, 404);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;
    const body = updateLeadSchema.parse(await request.json());

    const lead = await LeadManagementService.updateLead(payload.id, id, body);
    return successResponse(lead, 'Lead updated');
  } catch (error: any) {
    console.error(error); return errorResponse('An unexpected error occurred', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;

    await LeadManagementService.deleteLead(payload.id, id);
    return successResponse(null, 'Lead deleted');
  } catch (error: any) {
    console.error(error); return errorResponse('An unexpected error occurred', 500);
  }
}
