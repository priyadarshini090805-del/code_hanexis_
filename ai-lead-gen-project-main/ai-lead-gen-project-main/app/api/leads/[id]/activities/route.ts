import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { LeadService } from '@/lib/services/lead.service';
import { z } from 'zod';

const addActivitySchema = z.object({
  type: z.string(),
  description: z.string(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const activities = await LeadService.getActivities(auth.id, id);

    return successResponse('Activities retrieved', { activities });
  } catch (error: any) {
    console.error('GET /api/leads/:id/activities error:', error);
    return errorResponse(error.message, 500);
  }
}

export async function POST(
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
    const { type, description } = addActivitySchema.parse(body);

    const activity = await LeadService.addActivity(auth.id, id, type, description);

    return NextResponse.json(
      successResponse('Activity added', { activity }),
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation error', error.errors, 400);
    }
    console.error('POST /api/leads/:id/activities error:', error);
    return errorResponse(error.message, 500);
  }
}
