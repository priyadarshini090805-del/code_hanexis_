import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { NotificationService } from '@/lib/services/notification.service';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true';
    const [items, unreadCount] = await Promise.all([
      NotificationService.list(auth.id, { unreadOnly }),
      NotificationService.unreadCount(auth.id),
    ]);
    return successResponse('Notifications', { items, unreadCount });
  } catch (e: any) {
    return errorResponse(e.message, 401);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    await NotificationService.markAllRead(auth.id);
    return successResponse('All notifications marked read', {});
  } catch (e: any) {
    return errorResponse(e.message, 401);
  }
}
