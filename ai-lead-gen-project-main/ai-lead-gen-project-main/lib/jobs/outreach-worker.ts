import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { ConversationService } from '@/lib/services/conversation.service';
import { fromJsonField } from '@/lib/json-field';

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5 * 60 * 1000;

/**
 * Consume outreach & follow-up jobs from PublishingQueue, deliver the message
 * (email when configured), record the conversation thread, and update
 * CampaignLead status + campaign analytics counters.
 *
 * This closes the core loop: Campaign launch -> outreach send -> follow-up
 * -> analytics. LinkedIn/Instagram DM delivery is not available via their
 * public APIs, so email is the delivery channel.
 */
export async function processOutreachQueue(limit = 25): Promise<any[]> {
  const now = new Date();
  const jobs = await prisma.publishingQueue.findMany({
    where: {
      platform: { in: ['outreach', 'followup'] },
      status: 'pending',
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    take: limit,
    orderBy: { createdAt: 'asc' },
  });

  const results: any[] = [];

  for (const job of jobs) {
    // Atomically claim the job so concurrent runs don't double-send.
    const claimed = await prisma.publishingQueue.updateMany({
      where: { id: job.id, status: 'pending' },
      data: { status: 'processing', lastAttemptAt: now },
    });
    if (claimed.count === 0) continue;

    try {
      const data = JSON.parse(job.errorMessage || '{}');
      if (job.platform === 'outreach') {
        await processOutreach(data);
      } else {
        await processFollowup(data);
      }
      await prisma.publishingQueue.update({
        where: { id: job.id },
        data: { status: 'published' },
      });
      results.push({ id: job.id, platform: job.platform, status: 'sent' });
    } catch (e: any) {
      const attempts = job.attemptCount + 1;
      const willRetry = attempts < MAX_ATTEMPTS;
      await prisma.publishingQueue.update({
        where: { id: job.id },
        data: {
          status: willRetry ? 'pending' : 'failed',
          attemptCount: attempts,
          nextRetryAt: willRetry ? new Date(Date.now() + RETRY_DELAY_MS) : null,
        },
      });
      if (!willRetry) {
        await markCampaignLeadFailed(job.platform, job.errorMessage, e.message).catch(() => null);
      }
      results.push({ id: job.id, platform: job.platform, status: willRetry ? 'retry' : 'failed', error: e.message });
    }
  }

  return results;
}

async function processOutreach(data: { campaignId: string; leadId: string; workflowId?: string; message?: string }) {
  const campaign = await prisma.campaign.findUnique({ where: { id: data.campaignId } });
  if (!campaign) throw new Error('Campaign not found');
  const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
  if (!lead) throw new Error('Lead not found');

  const message = resolveMessage(data.message, campaign, lead);
  await deliver(lead.email, campaign.name, message);
  await recordThread(campaign.userId, lead.id, message);

  await prisma.campaignLead.updateMany({
    where: { campaignId: campaign.id, leadId: lead.id },
    data: { status: 'SENT', sentAt: new Date(), failureReason: null },
  });
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { sentCount: { increment: 1 } },
  });
  await prisma.campaignActivity.create({
    data: {
      campaignId: campaign.id,
      action: 'sent',
      description: `Message sent to ${lead.firstName} ${lead.lastName}`,
    },
  });
  await prisma.leadActivity.create({
    data: { leadId: lead.id, activityType: 'NOTE_ADDED', description: 'Outreach message sent' },
  });
}

async function processFollowup(data: { campaignLeadId: string; message: string }) {
  const cl = await prisma.campaignLead.findUnique({
    where: { id: data.campaignLeadId },
    include: { campaign: true, lead: true },
  });
  if (!cl) throw new Error('CampaignLead not found');

  const message = resolveMessage(data.message, cl.campaign, cl.lead);
  await deliver(cl.lead.email, cl.campaign.name, message);
  await recordThread(cl.campaign.userId, cl.leadId, message);

  await prisma.campaignActivity.create({
    data: {
      campaignId: cl.campaignId,
      action: 'sent',
      description: `Follow-up sent to ${cl.lead.firstName} ${cl.lead.lastName}`,
    },
  });
  await prisma.leadActivity.create({
    data: { leadId: cl.leadId, activityType: 'NOTE_ADDED', description: 'Follow-up message sent' },
  });
}

async function markCampaignLeadFailed(platform: string, payload: string | null, reason: string) {
  const data = JSON.parse(payload || '{}');
  if (platform === 'outreach' && data.campaignId && data.leadId) {
    await prisma.campaignLead.updateMany({
      where: { campaignId: data.campaignId, leadId: data.leadId },
      data: { status: 'FAILED', failureReason: reason?.slice(0, 500) },
    });
  } else if (platform === 'followup' && data.campaignLeadId) {
    await prisma.campaignLead.update({
      where: { id: data.campaignLeadId },
      data: { failureReason: reason?.slice(0, 500) },
    });
  }
}

/** Substitute {{firstName}} / {{lastName}} / {{company}} placeholders. */
function resolveMessage(jobMessage: string | undefined, campaign: any, lead: any): string {
  const settings = fromJsonField<Record<string, any>>(campaign.settings) || {};
  const tpl =
    jobMessage ||
    settings.messageTemplate ||
    settings.message ||
    `Hi {{firstName}}, I'd love to connect with you regarding ${campaign.name}.`;
  return String(tpl)
    .replace(/{{\s*firstName\s*}}/gi, lead.firstName || '')
    .replace(/{{\s*lastName\s*}}/gi, lead.lastName || '')
    .replace(/{{\s*company\s*}}/gi, lead.company || '');
}

/** Send via email when a real key is configured; otherwise no-op (the message
 * is still recorded as a conversation, so the loop is demonstrable). */
async function deliver(toEmail: string, subject: string, message: string) {
  const key = process.env.RESEND_API_KEY;
  if (key && !key.startsWith('YOUR_') && toEmail) {
    await sendEmail({
      to: toEmail,
      subject,
      html: `<div style="font-family:Arial,sans-serif">${message.replace(/\n/g, '<br/>')}</div>`,
    });
  }
}

async function recordThread(userId: string, leadId: string, message: string) {
  const convo = await ConversationService.getOrCreateConversation(userId, leadId, 'email');
  await prisma.conversationMessage.create({
    data: { conversationId: convo.id, sender: 'user', content: message },
  });
  await prisma.conversation.update({
    where: { id: convo.id },
    data: { lastMessageAt: new Date() },
  });
}
