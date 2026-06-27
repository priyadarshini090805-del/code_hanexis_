import { prisma } from '@/lib/prisma';

/** Aggregation helpers, aligned to the real schema (CampaignLead engagement). */
export class AnalyticsAggregationService {
  static async aggregateDailyMetrics(userId: string, date?: Date) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const [leads, campaigns, generations] = await Promise.all([
      prisma.lead.findMany({ where: { userId, createdAt: { gte: targetDate, lt: nextDay } } }),
      prisma.campaign.findMany({ where: { userId, createdAt: { gte: targetDate, lt: nextDay } } }),
      prisma.aIGeneration.findMany({
        where: { userId, createdAt: { gte: targetDate, lt: nextDay } },
        select: { tokensUsed: true },
      }),
    ]);

    const convertedLeads = leads.filter((l) => l.status === 'CONVERTED').length;

    return prisma.analytics.upsert({
      where: { userId_date: { userId, date: targetDate } },
      update: {
        totalLeads: leads.length,
        newLeads: leads.length,
        contactedLeads: leads.filter((l) => l.status === 'CONTACTED').length,
        qualifiedLeads: leads.filter((l) => l.status === 'QUALIFIED').length,
        convertedLeads,
        conversionRate: leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0,
        campaignsRun: campaigns.filter((c) => c.status === 'ACTIVE').length,
        messagesGenerated: generations.length,
        tokensUsed: generations.reduce((s, g) => s + g.tokensUsed, 0),
      },
      create: {
        userId,
        date: targetDate,
        totalLeads: leads.length,
        newLeads: leads.length,
        contactedLeads: leads.filter((l) => l.status === 'CONTACTED').length,
        qualifiedLeads: leads.filter((l) => l.status === 'QUALIFIED').length,
        convertedLeads,
        conversionRate: leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0,
        campaignsRun: campaigns.filter((c) => c.status === 'ACTIVE').length,
        messagesGenerated: generations.length,
        tokensUsed: generations.reduce((s, g) => s + g.tokensUsed, 0),
      },
    });
  }

  static async calculateConversionFunnel(userId: string, dateFrom?: Date, dateTo?: Date) {
    const from = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = dateTo || new Date();
    const leads = await prisma.lead.findMany({
      where: { userId, createdAt: { gte: from, lte: to } },
      select: { status: true },
    });
    const c = {
      NEW: leads.filter((l) => l.status === 'NEW').length,
      CONTACTED: leads.filter((l) => l.status === 'CONTACTED').length,
      QUALIFIED: leads.filter((l) => l.status === 'QUALIFIED').length,
      CONVERTED: leads.filter((l) => l.status === 'CONVERTED').length,
      LOST: leads.filter((l) => l.status === 'LOST').length,
    };
    const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
    return {
      funnel: [
        { stage: 'NEW', count: c.NEW, percentage: 100 },
        { stage: 'CONTACTED', count: c.CONTACTED, percentage: pct(c.CONTACTED, c.NEW) },
        { stage: 'QUALIFIED', count: c.QUALIFIED, percentage: pct(c.QUALIFIED, c.CONTACTED) },
        { stage: 'CONVERTED', count: c.CONVERTED, percentage: pct(c.CONVERTED, c.QUALIFIED) },
      ],
      totalLeads: leads.length,
      conversionRate: pct(c.CONVERTED, leads.length),
    };
  }

  static async calculateCampaignMetrics(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId },
      include: { leads: true },
    });
    if (!campaign) throw new Error('Campaign not found');

    const total = campaign.leads.length;
    const sent = campaign.leads.filter((l) => l.sentAt !== null).length;
    const opened = campaign.leads.filter((l) => l.openedAt !== null).length;
    const replied = campaign.leads.filter((l) => l.repliedAt !== null).length;
    const failed = campaign.leads.filter((l) => l.status === 'FAILED').length;

    return {
      campaignId: campaign.id,
      name: campaign.name,
      status: campaign.status,
      totalLeads: total,
      sentMessages: sent,
      openedMessages: opened,
      repliedMessages: replied,
      failedMessages: failed,
      openRate: sent > 0 ? (opened / sent) * 100 : 0,
      replyRate: sent > 0 ? (replied / sent) * 100 : 0,
    };
  }

  static async generateGrowthMetrics(userId: string, dateFrom: Date, dateTo: Date) {
    const analytics = await prisma.analytics.findMany({
      where: { userId, date: { gte: dateFrom, lte: dateTo } },
      orderBy: { date: 'asc' },
    });
    const first = analytics[0];
    const last = analytics[analytics.length - 1];
    return {
      period: { from: dateFrom, to: dateTo },
      startMetrics: first ?? null,
      endMetrics: last ?? null,
      growth: {
        leads: (last?.totalLeads ?? 0) - (first?.totalLeads ?? 0),
        contacts: (last?.contactedLeads ?? 0) - (first?.contactedLeads ?? 0),
        qualifications: (last?.qualifiedLeads ?? 0) - (first?.qualifiedLeads ?? 0),
        conversions: (last?.convertedLeads ?? 0) - (first?.convertedLeads ?? 0),
      },
      timeline: analytics.map((a) => ({
        date: a.date, leads: a.totalLeads, contacts: a.contactedLeads,
        qualified: a.qualifiedLeads, converted: a.convertedLeads,
      })),
    };
  }

  static async calculateActivityMetrics(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activities = await prisma.leadActivity.findMany({
      where: { lead: { userId }, createdAt: { gte: today } },
      select: { activityType: true },
    });
    const breakdown = activities.reduce((acc: Record<string, number>, a) => {
      acc[a.activityType] = (acc[a.activityType] || 0) + 1;
      return acc;
    }, {});
    const leadCount = await prisma.lead.count({ where: { userId } });
    return {
      totalActivities: activities.length,
      activityBreakdown: breakdown,
      activitiesPerLead: leadCount > 0 ? activities.length / leadCount : 0,
    };
  }

  static async getEngagementMetrics(userId: string, campaignId: string) {
    const leads = await prisma.campaignLead.findMany({
      where: { campaignId, campaign: { userId } },
    });
    const totalSent = leads.filter((l) => l.sentAt !== null).length;
    const opened = leads.filter((l) => l.openedAt !== null).length;
    const replied = leads.filter((l) => l.repliedAt !== null).length;
    const failed = leads.filter((l) => l.status === 'FAILED').length;
    return {
      totalSent, opened, replied, failed,
      openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
      replyRate: totalSent > 0 ? (replied / totalSent) * 100 : 0,
      failureRate: leads.length > 0 ? (failed / leads.length) * 100 : 0,
    };
  }
}
