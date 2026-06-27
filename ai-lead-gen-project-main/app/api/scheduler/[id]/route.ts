import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { ContentService } from '@/lib/services/content.service';
import { z } from 'zod';

const updateScheduleSchema = z.object({
  scheduledFor: z.string().datetime().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateScheduleSchema.parse(body);

    if (data.scheduledFor) {
      const result = await ContentService.rescheduleContent(
        auth.id,
        id,
        new Date(data.scheduledFor)
      );
      return successResponse('Content rescheduled', result);
    }

    return errorResponse('No reschedule data provided', 400);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation error', error.errors, 400);
    }
    console.error('PUT /api/scheduler/:id error:', error);
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const result = await ContentService.cancelScheduled(auth.id, id);

    return successResponse('Scheduled content cancelled', result);
  } catch (error: any) {
    console.error('DELETE /api/scheduler/:id error:', error);
    return errorResponse(error.message, 500);
  }
}
