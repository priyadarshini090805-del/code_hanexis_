import { prisma } from '@/lib/prisma';
import { addContentJob } from '@/lib/queue';
import { SchedulerService } from './scheduler.service';

export class ContentService {
  static async scheduleContent(
    userId: string,
    contentId: string,
    platform: string,
    scheduledFor: Date,
    timezone: string = 'UTC'
  ) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content || content.userId !== userId) {
      throw new Error('Content not found');
    }

    const scheduledContent = await prisma.scheduledContent.create({
      data: {
        userId,
        contentId,
        platform,
        scheduledFor,
        timezone,
        status: 'SCHEDULED',
        title: content.title || 'Scheduled post',
        body: content.body || '',
      },
    });

    // Publishing handled by /api/cron/process-scheduled
    return scheduledContent;
  }

  static async rescheduleContent(
    userId: string,
    scheduledContentId: string,
    newScheduledFor: Date
  ) {
    const scheduled = await prisma.scheduledContent.findUnique({
      where: { id: scheduledContentId },
      include: { content: true },
    });

    if (!scheduled || scheduled.content?.userId !== userId) {
      throw new Error('Scheduled content not found');
    }

    const updated = await prisma.scheduledContent.update({
      where: { id: scheduledContentId },
      data: {
        scheduledFor: newScheduledFor,
      },
    });

    return updated;
  }

  static async cancelScheduled(userId: string, scheduledContentId: string) {
    const scheduled = await prisma.scheduledContent.findUnique({
      where: { id: scheduledContentId },
      include: { content: true },
    });

    if (!scheduled || scheduled.content?.userId !== userId) {
      throw new Error('Scheduled content not found');
    }

    const updated = await prisma.scheduledContent.update({
      where: { id: scheduledContentId },
      data: { status: 'CANCELLED' },
    });

    return updated;
  }

  static async getMonthlyCalendar(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const scheduled = await prisma.scheduledContent.findMany({
      where: {
        content: { userId },
        scheduledFor: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: { content: true },
      orderBy: { scheduledFor: 'asc' },
    });

    return scheduled;
  }

  static async getWeeklyCalendar(userId: string, startDate: Date) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const scheduled = await prisma.scheduledContent.findMany({
      where: {
        content: { userId },
        scheduledFor: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: { content: true },
      orderBy: { scheduledFor: 'asc' },
    });

    return scheduled;
  }

  static async getDailyCalendar(userId: string, date: Date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const scheduled = await prisma.scheduledContent.findMany({
      where: {
        content: { userId },
        scheduledFor: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { content: true },
      orderBy: { scheduledFor: 'asc' },
    });

    return scheduled;
  }

  static async publishContent(scheduledContentId: string, platform: string) {
    const scheduled = await prisma.scheduledContent.findUnique({
      where: { id: scheduledContentId },
      include: { content: true },
    });

    if (!scheduled) {
      throw new Error('Scheduled content not found');
    }

    await prisma.scheduledContent.update({
      where: { id: scheduledContentId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    return scheduled;
  }

  static async getScheduledStats(userId: string) {
    const total = await prisma.scheduledContent.count({
      where: {
        content: { userId },
      },
    });

    const pending = await prisma.scheduledContent.count({
      where: {
        content: { userId },
        status: 'PENDING',
      },
    });

    const published = await prisma.scheduledContent.count({
      where: {
        content: { userId },
        status: 'PUBLISHED',
      },
    });

    const cancelled = await prisma.scheduledContent.count({
      where: {
        content: { userId },
        status: 'CANCELLED',
      },
    });

    return { total, pending, published, cancelled };
  }
}
