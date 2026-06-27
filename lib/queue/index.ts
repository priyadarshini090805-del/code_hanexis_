/**
 * DB-backed job queue (Vercel-compatible).
 * Jobs are stored in Postgres and processed by the cron route
 * /api/cron/process-scheduled (see vercel.json).
 * Replaces the previous Bull/Redis implementation.
 */
import { prisma } from '@/lib/prisma';

export interface OutreachJobData {
  campaignId: string;
  leadId: string;
  workflowId?: string;
  message?: string;
}

export interface ContentJobData {
  contentId?: string;
  scheduledContentId?: string;
  scheduledId?: string;
  userId?: string;
  platform: string;
}

export interface FollowupJobData {
  campaignLeadId: string;
  message: string;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  message: string;
  title?: string;
  link?: string;
}

interface JobOptions {
  delay?: number;
  attempts?: number;
}

function runAt(options?: JobOptions): Date {
  return new Date(Date.now() + (options?.delay || 0));
}

/** Outreach jobs are stored as ScheduledMessage rows when possible; otherwise tracked via PublishingQueue. */
export async function addOutreachJob(data: OutreachJobData, options?: JobOptions) {
  return prisma.publishingQueue.create({
    data: {
      scheduledContentId: `outreach:${data.campaignId}:${data.leadId}`,
      platform: 'outreach',
      status: 'pending',
      nextRetryAt: runAt(options),
      errorMessage: JSON.stringify(data),
    },
  });
}

export async function addContentJob(data: ContentJobData, options?: JobOptions) {
  const scheduledId = data.scheduledContentId || data.scheduledId;
  if (!scheduledId) return null;
  return prisma.publishingQueue.create({
    data: {
      scheduledContentId: scheduledId,
      platform: data.platform,
      status: 'pending',
      nextRetryAt: runAt(options),
    },
  });
}

export async function addFollowupJob(data: FollowupJobData, options?: JobOptions) {
  return prisma.publishingQueue.create({
    data: {
      scheduledContentId: `followup:${data.campaignLeadId}`,
      platform: 'followup',
      status: 'pending',
      nextRetryAt: runAt(options),
      errorMessage: JSON.stringify(data),
    },
  });
}

export async function addNotificationJob(data: NotificationJobData) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title || data.message.slice(0, 120),
      body: data.message,
      link: data.link,
    },
  });
}

/** Compatibility facade for code that used `queue.contentQueue.add(...)` etc. */
function makeCompatQueue(platformDefault: string) {
  return {
    async add(_name: string, data: any, options?: JobOptions) {
      const scheduledId = data?.scheduledContentId || data?.scheduledId;
      if (scheduledId) {
        return addContentJob(
          { ...data, scheduledContentId: scheduledId, platform: data?.platform || platformDefault },
          options
        );
      }
      if (data?.campaignId && data?.leadId) return addOutreachJob(data, options);
      if (data?.userId && data?.message) return addNotificationJob(data);
      return prisma.publishingQueue.create({
        data: {
          scheduledContentId: `job:${platformDefault}:${Date.now()}`,
          platform: platformDefault,
          status: 'pending',
          nextRetryAt: runAt(options),
          errorMessage: JSON.stringify(data ?? {}),
        },
      });
    },
    async getJobCounts() {
      const [pending, processing, published, failed] = await Promise.all([
        prisma.publishingQueue.count({ where: { status: 'pending' } }),
        prisma.publishingQueue.count({ where: { status: 'processing' } }),
        prisma.publishingQueue.count({ where: { status: 'published' } }),
        prisma.publishingQueue.count({ where: { status: 'failed' } }),
      ]);
      return { waiting: pending, active: processing, completed: published, failed, delayed: 0 };
    },
  };
}

export const outreachQueue = makeCompatQueue('outreach');
export const contentQueue = makeCompatQueue('content');
export const followupQueue = makeCompatQueue('followup');
export const notificationQueue = makeCompatQueue('notification');

export const queue = { outreachQueue, contentQueue, followupQueue, notificationQueue };
export default queue;
