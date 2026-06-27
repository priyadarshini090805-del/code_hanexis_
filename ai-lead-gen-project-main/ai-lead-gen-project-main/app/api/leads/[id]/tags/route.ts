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
    const { tag, action } = body;

    if (!tag) {
      return errorResponse('Tag is required', 400);
    }

    let lead;
    if (action === 'add') {
      lead = await LeadManagementService.addTag(payload.id, id, tag);
    } else if (action === 'remove') {
      lead = await LeadManagementService.removeTag(payload.id, id, tag);
    } else {
      return errorResponse('Invalid action', 400);
    }

    return successResponse(lead, `Tag ${action}ed`);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
