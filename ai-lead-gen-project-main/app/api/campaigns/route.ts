import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { CampaignManagementService } from '@/lib/services/campaign-management.service';

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const body = await request.json();

    const campaign = await CampaignManagementService.createCampaign(
      payload.id,
      body.name,
      body.description,
      body.workflowId
    );

    if (body.leadIds && body.leadIds.length > 0) {
      await CampaignManagementService.addLeadsToCampaign(campaign.id, body.leadIds);
    }

    return successResponse(campaign, 'Campaign created');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: payload.id,
        ...(status && { status }),
      },
      include: { leads: true, workflow: true },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(campaigns);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
