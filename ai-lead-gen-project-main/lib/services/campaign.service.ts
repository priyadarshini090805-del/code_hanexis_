import { prisma } from '@/lib/prisma';
import { addOutreachJob } from '@/lib/queue';
import { WorkflowRuntimeService } from '@/lib/services/workflow-runtime.service';

/** Campaign service aligned to schema: status uses CampaignStatus (ACTIVE, not RUNNING),
 *  engagement lives on CampaignLead, there is no `messages` relation. */
export class CampaignService {
  static async createCampaign(userId: string, name: string, description?: string) {
    return prisma.campaign.create({ data: { userId, name, description, status: 'DRAFT' } });
  }

  static async getCampaigns(userId: string) {
    return prisma.campaign.findMany({
      where: { userId },
      include: { leads: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getCampaign(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        leads: { include: { lead: true } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!campaign || campaign.userId !== userId) throw new Error('Campaign not found');
    return campaign;
  }

  static async updateCampaign(userId: string, campaignId: string, data: { name?: string; description?: string }) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.userId !== userId) throw new Error('Campaign not found');
    return prisma.campaign.update({ where: { id: campaignId }, data, include: { leads: true } });
  }

  static async deleteCampaign(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.userId !== userId) throw new Error('Campaign not found');
    await prisma.campaign.delete({ where: { id: campaignId } });
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

  static async pauseCampaign(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.userId !== userId) throw new Error('Campaign not found');
    return prisma.campaign.update({ where: { id: campaignId }, data: { status: 'PAUSED' } });
  }

  static async resumeCampaign(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.userId !== userId) throw new Error('Campaign not found');
    return prisma.campaign.update({ where: { id: campaignId }, data: { status: 'ACTIVE' } });
  }

  static async completeCampaign(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.userId !== userId) throw new Error('Campaign not found');
    return prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  static async addLeadsToCampaign(userId: string, campaignId: string, leadIds: string[]) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.userId !== userId) throw new Error('Campaign not found');
    for (const leadId of leadIds) {
      await prisma.campaignLead.upsert({
        where: { campaignId_leadId: { campaignId, leadId } },
        update: {},
        create: { campaignId, leadId, status: 'PENDING' },
      });
    }
    return prisma.campaign.findUnique({ where: { id: campaignId }, include: { leads: true } });
  }

  static async setWorkflow(userId: string, campaignId: string, workflowId: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.userId !== userId) throw new Error('Campaign not found');
    const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!workflow || workflow.userId !== userId) throw new Error('Workflow not found');
    return prisma.campaign.update({ where: { id: campaignId }, data: { workflowId } });
  }
}
