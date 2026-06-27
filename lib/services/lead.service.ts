import { prisma } from '@/lib/prisma';

export class LeadService {
  static async createLead(
    userId: string,
    data: {
      firstName: string;
      lastName?: string;
      email: string;
      phone?: string;
      company?: string;
      tags?: string[];
    }
  ) {
    const tagConnects = data.tags?.length
      ? await Promise.all(
          data.tags.map(async (name) => {
            const tag = await prisma.leadTag.upsert({
              where: { userId_name: { userId, name } },
              update: {},
              create: { userId, name },
            });
            return { id: tag.id };
          })
        )
      : [];

    return prisma.lead.create({
      data: {
        userId,
        firstName: data.firstName,
        lastName: data.lastName ?? '',
        email: data.email,
        phone: data.phone,
        company: data.company,
        status: 'NEW',
        ...(tagConnects.length && { tags: { connect: tagConnects } }),
      },
      include: { tags: true },
    });
  }

  static async getLeads(userId: string, status?: string) {
    return prisma.lead.findMany({
      where: {
        userId,
        ...(status && { status: status as any }),
      },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getLead(userId: string, leadId: string) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead || lead.userId !== userId) {
      throw new Error('Lead not found');
    }

    return lead;
  }

  static async updateLead(
    userId: string,
    leadId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      company?: string;
      status?: string;
      notes?: string;
      tags?: string[];
    }
  ) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.userId !== userId) throw new Error('Lead not found');

    const { tags, status, ...rest } = data;

    const tagConnects = tags?.length
      ? await Promise.all(
          tags.map(async (name) => {
            const tag = await prisma.leadTag.upsert({
              where: { userId_name: { userId, name } },
              update: {},
              create: { userId, name },
            });
            return { id: tag.id };
          })
        )
      : undefined;

    return prisma.lead.update({
      where: { id: leadId },
      data: {
        ...rest,
        ...(status && { status: status as any }),
        ...(tagConnects !== undefined && { tags: { set: tagConnects } }),
      },
      include: {
        tags: true,
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  static async deleteLead(userId: string, leadId: string) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.userId !== userId) throw new Error('Lead not found');
    await prisma.lead.delete({ where: { id: leadId } });
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

  static async getActivities(userId: string, leadId: string) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead || lead.userId !== userId) throw new Error('Lead not found');

    return prisma.leadActivity.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      take: 100,
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
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
