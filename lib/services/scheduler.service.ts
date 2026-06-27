import { prisma } from '@/lib/prisma';
import { queue } from '@/lib/queue';
import { toJsonField } from '@/lib/json-field';

export class SchedulerService {
  static async scheduleContent(
    userId: string,
    contentId: string,
    platform: string,
    scheduledFor: Date,
    additionalData?: Record<string, any>
  ) {
    const content = contentId
      ? await prisma.content.findFirst({ where: { id: contentId, userId } })
      : null;

    const scheduled = await prisma.scheduledContent.create({
      data: {
        userId,
        contentId,
        platform,
        scheduledFor,
        status: 'SCHEDULED',
        title: (additionalData?.title as string) || content?.title || 'Scheduled post',
        body: (additionalData?.body as string) || content?.body || '',
        metadata: toJsonField(additionalData || {}),
      },
    });

    // Publishing is handled by the cron route /api/cron/process-scheduled
    return scheduled;
  }

  static async rescheduleContent(userId: string, scheduledId: string, newScheduledFor: Date) {
    const scheduled = await prisma.scheduledContent.findFirst({
      where: { id: scheduledId, userId },
    });

    if (!scheduled) throw new Error('Scheduled content not found');
    if (!['PENDING', 'SCHEDULED'].includes(scheduled.status)) throw new Error('Can only reschedule pending content');

    const updated = await prisma.scheduledContent.update({
      where: { id: scheduledId },
      data: { scheduledFor: newScheduledFor },
    });

    return updated;
  }

  static async cancelScheduled(userId: string, scheduledId: string) {
    const scheduled = await prisma.scheduledContent.findFirst({
      where: { id: scheduledId, userId },
    });

    if (!scheduled) throw new Error('Scheduled content not found');
    if (!['PENDING', 'SCHEDULED'].includes(scheduled.status)) throw new Error('Can only cancel pending content');

    return await prisma.scheduledContent.update({
      where: { id: scheduledId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  static async getScheduledContent(userId: string, filters?: { platform?: string; status?: string }) {
    return await prisma.scheduledContent.findMany({
      where: {
        userId,
        ...(filters?.platform && { platform: filters.platform }),
        ...(filters?.status && { status: filters.status as any }),
      },
      include: { content: true },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  static async getScheduledContentByDate(userId: string, date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return await prisma.scheduledContent.findMany({
      where: {
        userId,
        scheduledFor: { gte: start, lte: end },
      },
      include: { content: true },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  static async getUpcomingScheduled(userId: string, days: number = 7) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return await prisma.scheduledContent.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'SCHEDULED'] },
        scheduledFor: { gte: now, lte: future },
      },
      include: { content: true },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  static async publishScheduledContent(scheduledId: string, userId: string) {
    const scheduled = await prisma.scheduledContent.findFirst({
      where: { id: scheduledId, userId },
      include: { content: true },
    });

    if (!scheduled) throw new Error('Scheduled content not found');

    const updated = await prisma.scheduledContent.update({
      where: { id: scheduledId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    await queue.contentQueue.add('track', {
      platform: scheduled.platform,
      contentId: scheduled.contentId,
      userId,
    });

    return updated;
  }

  static async markPublishFailed(scheduledId: string, userId: string, error: string) {
    const scheduled = await prisma.scheduledContent.findFirst({
      where: { id: scheduledId, userId },
    });

    if (!scheduled) throw new Error('Scheduled content not found');

    return await prisma.scheduledContent.update({
      where: { id: scheduledId },
      data: {
        status: 'FAILED',
        failureReason: error,
        failedAt: new Date(),
      },
    });
  }

  static async retryPublishing(userId: string, scheduledId: string, delayMs: number = 60000) {
    const scheduled = await prisma.scheduledContent.findFirst({
      where: { id: scheduledId, userId },
    });

    if (!scheduled) throw new Error('Scheduled content not found');
    if (scheduled.status !== 'FAILED') throw new Error('Can only retry failed publishes');

    await prisma.scheduledContent.update({
      where: { id: scheduledId },
      data: { status: 'SCHEDULED', failureReason: null, failedAt: null, scheduledFor: new Date(Date.now() + delayMs) },
    });

  }
}
