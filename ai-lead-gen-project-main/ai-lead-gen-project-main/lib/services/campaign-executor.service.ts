import { prisma } from '@/lib/prisma';
import { addOutreachJob, addFollowupJob } from '@/lib/queue';

export class CampaignExecutor {
  static async executeCampaignWorkflow(
    campaignId: string,
    leadIds: string[]
  ) {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          workflow: { include: { steps: { orderBy: { stepNumber: 'asc' } } } },
        },
      });

      if (!campaign || !campaign.workflow) {
        throw new Error('Campaign or workflow not found');
      }

      let executedJobs = 0;
      let currentDelay = 0;

      for (const step of campaign.workflow.steps) {
        switch (step.type) {
          case 'MESSAGE':
            for (const leadId of leadIds) {
              const campaignLead = await prisma.campaignLead.findUnique({
                where: { campaignId_leadId: { campaignId, leadId } },
              });
              if (campaignLead) {
                await addOutreachJob(
                  { campaignId, leadId, workflowId: campaign.workflowId || undefined },
                  { delay: currentDelay }
                );
                executedJobs++;
              }
            }
            break;
          case 'DELAY':
            currentDelay += (step.delayMinutes || 0) * 60000;
            break;
          case 'CONDITION':
            if (step.condition?.includes('replied')) continue;
            break;
          case 'BRANCH':
            break;
        }
      }

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'ACTIVE' },
      });

      return { success: true, campaignId, executedJobs };
    } catch (error) {
      console.error('Error executing campaign workflow:', error);
      throw error;
    }
  }

  static async handleWorkflowCompletion(campaignId: string) {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { leads: true },
      });

      if (!campaign) throw new Error('Campaign not found');

      const sentCount = await prisma.campaignLead.count({
        where: { campaignId, status: 'SENT' },
      });

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'COMPLETED', sentCount },
      });

      return { success: true, campaignId, sentCount };
    } catch (error) {
      console.error('Error completing campaign:', error);
      throw error;
    }
  }

  static async executeFollowupSequence(
    campaignId: string,
    followupMessage: string,
    delayHours: number
  ) {
    try {
      const campaignLeads = await prisma.campaignLead.findMany({
        where: { campaignId, status: 'SENT' },
      });

      for (const cl of campaignLeads) {
        await addFollowupJob(
          { campaignLeadId: cl.id, message: followupMessage },
          { delay: delayHours * 3600000 }
        );
      }

      return { success: true, followupCount: campaignLeads.length };
    } catch (error) {
      console.error('Error executing followup sequence:', error);
      throw error;
    }
  }
}
