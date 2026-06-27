import { prisma } from '@/lib/prisma';
import { queue, addOutreachJob } from '@/lib/queue';
import { toJsonField, fromJsonField } from '@/lib/json-field';
import { WorkflowRuntimeService } from '@/lib/services/workflow-runtime.service';

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

  static async launchCampaign(userId: string, campaignId: string, workflowId?: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, include: { leads: true } });
    if (!campaign || campaign.userId !== userId) throw new Error('Campaign not found');

    // workflow is optional — fall back to the campaign's own workflow if set.
    const wfId = workflowId || campaign.workflowId || undefined;
    let workflowSteps = 0;
    if (wfId) {
      const workflow = await prisma.workflow.findUnique({
        where: { id: wfId },
        include: { _count: { select: { steps: true } } },
      });
      if (!workflow || workflow.userId !== userId) throw new Error('Workflow not found');
      workflowSteps = workflow._count.steps;
    }

    if (campaign.leads.length === 0) throw new Error('Campaign has no leads to contact');

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE', workflowId: wfId, launchedAt: new Date(), startedAt: new Date() },
    });

    // If a workflow with steps is attached, drive each lead through the durable
    // workflow engine (message/delay/condition/branch). Otherwise fall back to a
    // single direct outreach per lead.
    const useEngine = !!wfId && workflowSteps > 0;
    for (const lead of campaign.leads) {
      if (useEngine) {
        await WorkflowRuntimeService.startExecution(campaignId, lead.leadId, wfId!);
      } else {
        await addOutreachJob({ campaignId, leadId: lead.leadId, workflowId: wfId });
      }
    }
    await prisma.campaignActivity.create({
      data: {
        campaignId,
        action: 'status_changed',
        description: useEngine
          ? `Campaign launched — ${campaign.leads.length} lead(s) entered the workflow engine`
          : `Campaign launched — ${campaign.leads.length} lead(s) queued for outreach`,
      },
    });
    return updated;
  }

  static async setWorkflow(userId: string, campaignId: string, workflowId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.userId !== userId) throw new Error('Campaign not found');
    const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow || workflow.userId !== userId) throw new Error('Workflow not found');
    return prisma.campaign.update({ where: { id: campaignId }, data: { workflowId } });
  }
}
