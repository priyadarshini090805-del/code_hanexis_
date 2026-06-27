import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/campaigns/outreach-history
 * Query params: campaignId?, leadId?, status? (PENDING|SENT|OPENED|REPLIED|FAILED|SKIPPED),
 *               page? (default 1), limit? (default 25, max 100)
 *
 * Outreach history is tracked on CampaignLead (status + sentAt/openedAt/repliedAt).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const sp = request.nextUrl.searchParams;

    const campaignId = sp.get('campaignId') || undefined;
    const leadId = sp.get('leadId') || undefined;
    const status = sp.get('status') || undefined;
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    const where: any = { campaign: { userId: auth.id } };
    if (campaignId) where.campaignId = campaignId;
    if (leadId) where.leadId = leadId;
    if (status) where.status = status;

    const [jobs, total, statsByStatus] = await Promise.all([
      prisma.campaignLead.findMany({
        where,
        include: {
          campaign: { select: { id: true, name: true, status: true } },
          lead: { select: { id: true, firstName: true, lastName: true, email: true, company: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.campaignLead.count({ where }),
      prisma.campaignLead.groupBy({
        by: ['status'],
        where: { campaign: { userId: auth.id }, ...(campaignId ? { campaignId } : {}) },
        _count: true,
      }),
    ]);

    const summary: Record<string, number> = {};
    statsByStatus.forEach((s: any) => { summary[s.status] = s._count; });

    return successResponse({
      jobs,
      summary,
      pagination: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
