import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    await verifyAuth(request);

    const metrics = [
      { name: 'outreach', count: 0, failed: 0, delayed: 0, active: 0, paused: 0, completed: 0 },
      { name: 'content', count: 0, failed: 0, delayed: 0, active: 0, paused: 0, completed: 0 },
      { name: 'followup', count: 0, failed: 0, delayed: 0, active: 0, paused: 0, completed: 0 },
      { name: 'notification', count: 0, failed: 0, delayed: 0, active: 0, paused: 0, completed: 0 },
    ];

    return successResponse(metrics);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
