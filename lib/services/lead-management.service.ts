import { prisma } from '@/lib/prisma';
import type { LeadStatus } from '@prisma/client';

/**
 * Lead management aligned to schema:
 * - Lead fields: jobTitle (not "title"), no "location".
 * - Tags are LeadTag entities (relation), not a string[].
 * - Activities are LeadActivity rows with activityType (enum), not a generic "activity" table.
 * - LeadStatus enum = NEW | CONTACTED | QUALIFIED | CONVERTED | LOST.
 */
const VALID_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];

export class LeadManagementService {
  static async createLead(
    userId: string,
    data: { firstName: string; lastName: string; email: string; company?: string; phone?: string; title?: string; jobTitle?: string }
  ) {
    const lead = await prisma.lead.create({
      data: {
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        company: data.company ?? null,
        phone: data.phone ?? null,
        jobTitle: data.jobTitle ?? data.title ?? null,
        status: 'NEW',
      },
    });
    await prisma.leadActivity.create({
      data: { leadId: lead.id, activityType: 'CREATED', description: 'Lead created' },
    });
    return lead;
  }

  static async updateLead(userId: string, leadId: string, data: Record<string, any>) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, userId } });
    if (!lead) throw new Error('Lead not found');
    const { title, location, lastContactedAt, convertedAt, tags, ...rest } = data;
    if (title && !rest.jobTitle) rest.jobTitle = title;
    return prisma.lead.update({ where: { id: leadId }, data: rest });
  }

  static async deleteLead(userId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, userId } });
    if (!lead) throw new Error('Lead not found');
    // LeadActivity / status history cascade on delete via schema.
    await prisma.lead.delete({ where: { id: leadId } });
  }

  static async getLead(userId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
      include: { tags: true, activities: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!lead) throw new Error('Lead not found');
    return lead;
  }

  static async getAllLeads(userId: string, filters?: { status?: string; tag?: string }) {
    return prisma.lead.findMany({
      where: {
        userId,
        ...(filters?.status && VALID_STATUSES.includes(filters.status)
          ? { status: filters.status as any }
          : {}),
        ...(filters?.tag ? { tags: { some: { name: filters.tag } } } : {}),
      },
      include: { tags: true, activities: { take: 1, orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async addTag(userId: string, leadId: string, tag: string) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, userId } });
    if (!lead) throw new Error('Lead not found');
    const tagRow = await prisma.leadTag.upsert({
      where: { userId_name: { userId, name: tag } },
      update: {},
      create: { userId, name: tag },
    });
    await prisma.lead.update({
      where: { id: leadId },
      data: { tags: { connect: { id: tagRow.id } } },
    });
    await prisma.leadActivity.create({
      data: { leadId, activityType: 'TAG_ADDED', description: `Tag "${tag}" added` },
    });
    return this.getLead(userId, leadId);
  }

  static async removeTag(userId: string, leadId: string, tag: string) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, userId } });
    if (!lead) throw new Error('Lead not found');
    const tagRow = await prisma.leadTag.findUnique({ where: { userId_name: { userId, name: tag } } });
    if (tagRow) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { tags: { disconnect: { id: tagRow.id } } },
      });
      await prisma.leadActivity.create({
        data: { leadId, activityType: 'TAG_REMOVED', description: `Tag "${tag}" removed` },
      });
    }
    return this.getLead(userId, leadId);
  }

  /** Records an activity; if `type` is a valid LeadStatus, also advances the lead's status. */
  static async trackActivity(
    userId: string,
    leadId: string,
    _campaignId: string | null,
    type: string,
    details?: Record<string, any>
  ) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, userId } });
    if (!lead) throw new Error('Lead not found');

    const upper = (type || '').toUpperCase();
    const desc = details ? JSON.stringify(details).slice(0, 500) : type;

    if (VALID_STATUSES.includes(upper) && upper !== lead.status) {
      await prisma.leadStatusHistory.create({
        data: { leadId, oldStatus: lead.status, newStatus: upper as any },
      });
      await prisma.lead.update({ where: { id: leadId }, data: { status: upper as any } });
      return prisma.leadActivity.create({
        data: { leadId, activityType: 'STATUS_CHANGED', description: `Status → ${upper}` },
      });
    }

    return prisma.leadActivity.create({
      data: { leadId, activityType: 'NOTE_ADDED', description: desc },
    });
  }

  static async bulkImportLeads(userId: string, leadsData: any[]) {
    return prisma.lead.createMany({
      data: leadsData
        .filter((l) => l.email)
        .map((l) => ({
          userId,
          firstName: l.firstName || '',
          lastName: l.lastName || '',
          email: l.email,
          company: l.company || null,
          phone: l.phone || null,
          jobTitle: l.jobTitle || l.title || null,
          status: 'NEW' as LeadStatus,
        })),
      skipDuplicates: true,
    });
  }

  static async searchLeads(userId: string, query: string) {
    return prisma.lead.findMany({
      where: {
        userId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }

  static async getLeadsByStatus(userId: string, status: string) {
    return prisma.lead.findMany({
      where: { userId, status: status as LeadStatus },
      include: { activities: { take: 1 } },
    });
  }

  static async scoreLeads(userId: string) {
    const leads = await prisma.lead.findMany({ where: { userId }, include: { activities: true } });
    return leads.map((lead) => ({ ...lead, score: this.calculateLeadScore(lead) }));
  }

  private static calculateLeadScore(lead: any) {
    let score = 0;
    if (lead.status === 'NEW') score += 5;
    if (lead.status === 'CONTACTED') score += 15;
    if (lead.status === 'QUALIFIED') score += 30;
    if (lead.status === 'CONVERTED') score += 100;
    score += (lead.activities?.length || 0) * 2;
    return Math.min(100, score);
  }

  static async getActivities(userId: string, leadId: string) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.userId !== userId) throw new Error('Lead not found');

    return prisma.leadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  static async addActivity(
    userId: string,
    leadId: string,
    type: string,
    description: string
  ) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.userId !== userId) throw new Error('Lead not found');

    return prisma.leadActivity.create({
      data: {
        leadId,
        activityType: type as any,
        description,
      },
    });
  }
}
