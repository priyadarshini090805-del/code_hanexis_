import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { LeadManagementService } from '@/lib/services/lead-management.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;
    const body = await request.json();

    const activity = await LeadManagementService.trackActivity(
      payload.id,
      id,
      body.campaignId || null,
      body.type,
      body.details
    );

    return successResponse(activity, 'Activity tracked');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
