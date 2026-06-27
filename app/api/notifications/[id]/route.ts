import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { NotificationService } from '@/lib/services/notification.service';
import { successResponse, errorResponse } from '@/lib/response';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAuth(request);
    const { id } = await params;
    await NotificationService.markRead(auth.id, id);
    return successResponse('Notification marked read', {});
  } catch (e: any) {
    return errorResponse(e.message, 401);
  }
}
