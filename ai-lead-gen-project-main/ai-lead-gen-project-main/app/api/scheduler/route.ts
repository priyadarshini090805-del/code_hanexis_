import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get('month') || '1');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const scheduled = await prisma.scheduledContent.findMany({
      where: {
        userId: payload.id,
        scheduledFor: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { scheduledFor: 'asc' },
    });

    const stats = {
      pending: scheduled.filter(s => s.status === 'PENDING').length,
      published: scheduled.filter(s => s.status === 'PUBLISHED').length,
      cancelled: scheduled.filter(s => s.status === 'CANCELLED').length,
      total: scheduled.length,
    };

    return successResponse({ scheduled, stats });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}


export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const body = await request.json();
    const { title, content, platform, scheduledFor, contentId, imageUrl, timezone } = body;

    if (!platform || !scheduledFor || (!content && !contentId)) {
      return errorResponse('platform, scheduledFor and content (or contentId) are required', 400);
    }

    const when = new Date(scheduledFor);
    if (isNaN(when.getTime()) || when.getTime() < Date.now() - 60000) {
      return errorResponse('scheduledFor must be a valid future date', 400);
    }

    let postBody = content || '';
    let postTitle = title || '';
    if (contentId) {
      const existing = await prisma.content.findFirst({ where: { id: contentId, userId: payload.id } });
      if (!existing) return errorResponse('Content not found', 404);
      postBody = postBody || existing.body;
      postTitle = postTitle || existing.title;
    }

    const isInstagram = platform.toLowerCase() === 'instagram';
    const scheduled = await prisma.scheduledContent.create({
      data: {
        userId: payload.id,
        contentId: contentId || null,
        platform: platform.toLowerCase(),
        scheduledFor: when,
        // scheduledFor is an absolute instant (UTC); store the author's
        // timezone so the UI can render the local wall-clock time correctly.
        timezone: typeof timezone === 'string' && timezone ? timezone : 'UTC',
        status: 'SCHEDULED',
        title: postTitle || postBody.slice(0, 80),
        body: isInstagram ? JSON.stringify({ caption: postBody, imageUrl }) : postBody,
      },
    });

    return successResponse({ scheduled });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
