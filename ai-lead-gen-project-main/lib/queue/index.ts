/**
 * DB-backed job queue (Vercel-compatible).
 *
 * General-purpose jobs (outreach, followup, notification) are stored in the
 * JobQueue table with typed enums and a proper Json payload column.
 *
 * Content publishing jobs use PublishingQueue (its intended purpose — tracking
 * publish attempts and failures for ScheduledContent).
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

export async function addOutreachJob(data: OutreachJobData, options?: JobOptions) {
  return prisma.jobQueue.create({
    data: {
      jobType: 'OUTREACH',
      status: 'PENDING',
      payload: data,
      campaignId: data.campaignId,
      leadId: data.leadId,
      maxAttempts: options?.attempts || 3,
      nextRetryAt: runAt(options),
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
  return prisma.jobQueue.create({
    data: {
      jobType: 'FOLLOWUP',
      status: 'PENDING',
      payload: data,
      maxAttempts: options?.attempts || 3,
      nextRetryAt: runAt(options),
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

const PLATFORM_TO_JOB_TYPE: Record<string, 'OUTREACH' | 'FOLLOWUP' | 'CONTENT' | 'NOTIFICATION'> = {
  outreach: 'OUTREACH',
  followup: 'FOLLOWUP',
  content: 'CONTENT',
  notification: 'NOTIFICATION',
};

/** Compatibility facade for code that uses `queue.contentQueue.add(...)` etc. */
function makeCompatQueue(platformDefault: string) {
  const jobType = PLATFORM_TO_JOB_TYPE[platformDefault] || 'OUTREACH';
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
      return prisma.jobQueue.create({
        data: {
          jobType,
          status: 'PENDING',
          payload: data ?? {},
          userId: data?.userId,
          campaignId: data?.campaignId,
          maxAttempts: options?.attempts || 3,
          nextRetryAt: runAt(options),
        },
      });
    },
    async getJobCounts() {
      const [pending, processing, completed, failed] = await Promise.all([
        prisma.jobQueue.count({ where: { jobType, status: 'PENDING' } }),
        prisma.jobQueue.count({ where: { jobType, status: 'PROCESSING' } }),
        prisma.jobQueue.count({ where: { jobType, status: 'COMPLETED' } }),
        prisma.jobQueue.count({ where: { jobType, status: 'FAILED' } }),
      ]);
      return { waiting: pending, active: processing, completed, failed, delayed: 0 };
    },
  };
}

export const outreachQueue = makeCompatQueue('outreach');
export const contentQueue = makeCompatQueue('content');
export const followupQueue = makeCompatQueue('followup');
export const notificationQueue = makeCompatQueue('notification');

export const queue = { outreachQueue, contentQueue, followupQueue, notificationQueue };
export default queue;
