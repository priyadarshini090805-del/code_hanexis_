import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);

    const [leads, campaigns, workflows, scheduled] = await Promise.all([
      prisma.lead.count({ where: { userId: payload.id } }),
      prisma.campaign.count({ where: { userId: payload.id } }),
      prisma.workflow.count({ where: { userId: payload.id } }),
      prisma.scheduledContent.findMany({
        where: { userId: payload.id, status: 'PENDING' },
        orderBy: { scheduledFor: 'asc' },
        take: 5,
      }),
    ]);

    const activeCampaigns = await prisma.campaign.count({
      where: { userId: payload.id, status: 'ACTIVE' },
    });

    return successResponse({
      totalLeads: leads,
      totalCampaigns: campaigns,
      activeCampaigns,
      totalWorkflows: workflows,
      upcomingScheduled: scheduled,
      recentActivity: [],
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
