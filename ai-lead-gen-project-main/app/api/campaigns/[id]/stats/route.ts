import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { CampaignManagementService } from '@/lib/services/campaign-management.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;

    const stats = await CampaignManagementService.getCampaignStats(id);
    return successResponse(stats);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
