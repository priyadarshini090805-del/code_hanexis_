import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

/** Campaign analytics derived from CampaignLead engagement (sentAt/openedAt/repliedAt/status). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;
    const period = request.nextUrl.searchParams.get('period') || '30d';
    const daysBack = parseInt(period) || 30;

    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: payload.id },
      include: { leads: true },
    });
    if (!campaign) return errorResponse('Campaign not found', 404);

    const leads = campaign.leads;
    const sent = leads.filter((l) => l.sentAt !== null).length;
    const opened = leads.filter((l) => l.openedAt !== null).length;
    const replied = leads.filter((l) => l.repliedAt !== null).length;
    const failed = leads.filter((l) => l.status === 'FAILED').length;

    const metrics = {
      id,
      name: campaign.name,
      status: campaign.status,
      totalLeads: leads.length,
      sent,
      opened,
      replied,
      failed,
      openRate: sent > 0 ? (opened / sent) * 100 : 0,
      replyRate: sent > 0 ? (replied / sent) * 100 : 0,
      failureRate: leads.length > 0 ? (failed / leads.length) * 100 : 0,
    };

    const dailyMetrics: any[] = [];
    for (let i = daysBack; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      const inDay = (d: Date | null) => d !== null && d >= start && d <= end;
      dailyMetrics.push({
        date: date.toISOString().split('T')[0],
        sent: leads.filter((l) => inDay(l.sentAt)).length,
        opened: leads.filter((l) => inDay(l.openedAt)).length,
        replied: leads.filter((l) => inDay(l.repliedAt)).length,
      });
    }

    return successResponse({ metrics, dailyMetrics });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
