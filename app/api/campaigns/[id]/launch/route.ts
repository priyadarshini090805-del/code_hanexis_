import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { requirePermission } from '@/lib/auth/authorize';
import { successResponse, errorResponse } from '@/lib/response';
import { CampaignService } from '@/lib/services/campaign.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }
    requirePermission(auth, 'outreach:create');

    const body = await request.json().catch(() => ({}));
    const result = await CampaignService.launchCampaign(auth.id, params.id, body?.workflowId);

    return NextResponse.json(
      successResponse('Campaign launched successfully', { result })
    );
  } catch (error: any) {
    console.error('POST /api/campaigns/:id/launch error:', error);
    return NextResponse.json(
      errorResponse(error.message),
      { status: error.status || 400 }
    );
  }
}
