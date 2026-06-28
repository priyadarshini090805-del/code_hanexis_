import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LinkedInService } from '@/lib/services/linkedin.service';
import { InstagramService } from '@/lib/services/instagram.service';
import { NotificationService } from '@/lib/services/notification.service';
import { WorkflowRuntimeService } from '@/lib/services/workflow-runtime.service';
import { logger } from '@/lib/logger';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Vercel Cron: publishes due scheduled content to LinkedIn / Instagram.
 * Runs every 5 minutes (see vercel.json). Retries up to 3 times.
 * Also advances durable workflow executions on each tick.
 * Outreach is handled by its own cron at /api/cron/process-outreach.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.scheduledContent.findMany({
    where: {
      status: { in: ['SCHEDULED', 'PENDING'] as any },
      scheduledFor: { lte: now },
    },
    take: 10,
    orderBy: { scheduledFor: 'asc' },
  });

  const results: any[] = [];

  for (const item of due) {
    // claim
    await prisma.scheduledContent.update({
      where: { id: item.id },
      data: { status: 'PUBLISHING' as any },
    }).catch(() => null);

    try {
      let postRef = '';
      if (item.platform.toLowerCase() === 'linkedin') {
        const { postUrn } = await LinkedInService.publishPost(item.userId, null, extractText(item.body));
        postRef = postUrn;
      } else if (item.platform.toLowerCase() === 'instagram') {
        const parsed = parseBody(item.body);
        postRef = await InstagramService.publishPost(item.userId, null, parsed.caption, parsed.imageUrl);
      } else {
        throw new Error(`Unsupported platform: ${item.platform}`);
      }

      await prisma.scheduledContent.update({
        where: { id: item.id },
        data: { status: 'PUBLISHED' as any, publishedAt: new Date(), failureReason: null },
      });
      await NotificationService.create(item.userId, {
        type: 'POST_PUBLISHED',
        title: `Post published to ${item.platform}`,
        body: item.title,
        link: '/dashboard/scheduler',
        metadata: { scheduledContentId: item.id, postRef },
      });
      results.push({ id: item.id, status: 'published' });
    } catch (e: any) {
      const attempts = await prisma.publishingQueue.count({
        where: { scheduledContentId: item.id, status: 'failed' },
      });
      const willRetry = attempts < 2;
      await prisma.publishingQueue.create({
        data: {
          scheduledContentId: item.id,
          platform: item.platform,
          status: 'failed',
          attemptCount: attempts + 1,
          lastAttemptAt: new Date(),
          errorMessage: e.message?.slice(0, 900),
        },
      });
      await prisma.scheduledContent.update({
        where: { id: item.id },
        data: willRetry
          ? { status: 'SCHEDULED' as any, scheduledFor: new Date(Date.now() + 5 * 60 * 1000), failureReason: e.message?.slice(0, 500) }
          : { status: 'FAILED' as any, failureReason: e.message?.slice(0, 500) },
      });
      if (!willRetry) {
        await NotificationService.create(item.userId, {
          type: 'POST_FAILED',
          title: `Failed to publish to ${item.platform}`,
          body: e.message?.slice(0, 300),
          link: '/dashboard/scheduler',
        });
      }
      results.push({ id: item.id, status: willRetry ? 'retry_scheduled' : 'failed', error: e.message });
    }
  }

  // Advance durable workflow executions on the same tick.
  const workflow = await WorkflowRuntimeService.tick().catch((e) => {
    logger.error('Workflow engine tick failed', { subsystem: 'cron', operation: 'workflow-tick', error: e.message });
    return [];
  });

  logger.info('Cron tick completed', { subsystem: 'cron', operation: 'process-scheduled', published: results.length, workflows: workflow.length });

  return NextResponse.json({
    processed: results.length,
    results,
    workflow: { processed: workflow.length, results: workflow },
    at: now.toISOString(),
  });
}

function parseBody(body: string): { caption: string; imageUrl?: string } {
  try {
    const parsed = JSON.parse(body);
    if (parsed && typeof parsed === 'object') {
      return { caption: parsed.caption || parsed.text || body, imageUrl: parsed.imageUrl };
    }
  } catch { /* plain text */ }
  return { caption: body };
}

function extractText(body: string): string {
  return parseBody(body).caption;
}
