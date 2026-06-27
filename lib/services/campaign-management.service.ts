import { prisma } from '@/lib/prisma';
import { queue } from '@/lib/queue';
import { toJsonField, fromJsonField } from '@/lib/json-field';

/** Campaign management aligned to schema: CampaignActivity.action (not Activity.type),
 *  CampaignLead for stats, settings is Json, status uses ACTIVE not RUNNING. */
export class CampaignManagementService {
  static async createCampaign(userId: string, name: string, description?: string, workflowId?: string) {
    return prisma.campaign.create({
      data: { userId, name, description: description || '', workflowId, status: 'DRAFT' },
    });
  }

  static async addLeadsToCampaign(campaignId: string, leadIds: string[]) {
    return prisma.campaignLead.createMany({
      data: leadIds.map((leadId) => ({ campaignId, leadId })),
      skipDuplicates: true,
    });
  }

  static async startCampaign(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status !== 'DRAFT') throw new Error('Campaign must be in DRAFT status');
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE', startedAt: new Date(), launchedAt: new Date() },
    });
    await queue.outreachQueue.add('campaign-start', { campaignId, userId });
    return updated;
  }

  static async pauseCampaign(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
    if (!campaign) throw new Error('Campaign not found');
    return prisma.campaign.update({ where: { id: campaignId }, data: { status: 'PAUSED' } });
  }

  static async resumeCampaign(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
    if (!campaign) throw new Error('Campaign not found');
    const updated = await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'ACTIVE' } });
    await queue.outreachQueue.add('campaign-resume', { campaignId, userId });
    return updated;
  }

  static async stopCampaign(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
    if (!campaign) throw new Error('Campaign not found');
    return prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  static async getCampaignLeads(campaignId: string) {
    return prisma.campaignLead.findMany({ where: { campaignId }, include: { lead: true } });
  }

  static async getCampaignStats(campaignId: string) {
    const leads = await prisma.campaignLead.findMany({ where: { campaignId } });
    return {
      totalLeads: leads.length,
      pending: leads.filter((l) => l.status === 'PENDING').length,
      sent: leads.filter((l) => l.sentAt !== null).length,
      opened: leads.filter((l) => l.openedAt !== null).length,
      replied: leads.filter((l) => l.repliedAt !== null).length,
      failed: leads.filter((l) => l.status === 'FAILED').length,
    };
  }

  static async updateCampaignSettings(userId: string, campaignId: string, settings: Record<string, any>) {
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
    if (!campaign) throw new Error('Campaign not found');
    const current = fromJsonField<Record<string, any>>(campaign.settings) || {};
    return prisma.campaign.update({
      where: { id: campaignId },
      data: { settings: toJsonField({ ...current, ...settings }) },
    });
  }

  static async deleteCampaign(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status !== 'DRAFT') throw new Error('Only draft campaigns can be deleted');
    await prisma.campaignLead.deleteMany({ where: { campaignId } });
    await prisma.campaign.delete({ where: { id: campaignId } });
  }

  static async duplicateCampaign(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId },
      include: { leads: true },
    });
    if (!campaign) throw new Error('Campaign not found');
    const newCampaign = await prisma.campaign.create({
      data: {
        userId,
        name: `${campaign.name} (Copy)`,
        description: campaign.description,
        workflowId: campaign.workflowId,
        status: 'DRAFT',
      },
    });
    if (campaign.leads.length > 0) {
      await prisma.campaignLead.createMany({
        data: campaign.leads.map((cl) => ({ campaignId: newCampaign.id, leadId: cl.leadId })),
        skipDuplicates: true,
      });
    }
    return newCampaign;
  }
}
