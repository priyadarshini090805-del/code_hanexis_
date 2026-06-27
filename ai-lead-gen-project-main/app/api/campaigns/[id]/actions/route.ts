import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { CampaignManagementService } from '@/lib/services/campaign-management.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'start':
        result = await CampaignManagementService.startCampaign(payload.id, id);
        break;
      case 'pause':
        result = await CampaignManagementService.pauseCampaign(payload.id, id);
        break;
      case 'resume':
        result = await CampaignManagementService.resumeCampaign(payload.id, id);
        break;
      case 'stop':
        result = await CampaignManagementService.stopCampaign(payload.id, id);
        break;
      default:
        return errorResponse('Invalid action', 400);
    }

    return successResponse(result, `Campaign ${action}ed successfully`);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
