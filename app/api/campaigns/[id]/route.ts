import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  workflowId: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: payload.id },
      include: { leads: { include: { lead: true } }, workflow: true },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    return successResponse(campaign);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;
    const body = updateCampaignSchema.parse(await request.json());

    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: payload.id },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        name: body.name || campaign.name,
        description: body.description ?? campaign.description,
        workflowId: body.workflowId || campaign.workflowId,
      },
      include: { leads: true },
    });

    return successResponse(updated, 'Campaign updated');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: payload.id },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    await prisma.campaignLead.deleteMany({ where: { campaignId: id } });
    await prisma.campaign.delete({ where: { id } });

    return successResponse(null, 'Campaign deleted');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
