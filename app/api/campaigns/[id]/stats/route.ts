import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { CampaignManagementService } from '@/lib/services/campaign-management.service';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({ where: { id, userId: payload.id } });
    if (!campaign) return errorResponse('Campaign not found', 404);

    const stats = await CampaignManagementService.getCampaignStats(id);
    return successResponse(stats);
  } catch (error: any) {
    console.error(error); return errorResponse('An unexpected error occurred', 500);
  }
}
