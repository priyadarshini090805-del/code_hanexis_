import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

// POST /api/scheduler/[id]/approve
// Body: { notes?: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const item = await prisma.scheduledContent.findFirst({
      where: { id, userId: auth.id },
    });
    if (!item) return errorResponse('Not found', 404);
    if (item.status === 'PUBLISHED') return errorResponse('Already published', 400);

    const updated = await prisma.scheduledContent.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvalNotes: body.notes?.trim() || null,
        // Move to SCHEDULED so the cron picks it up
        status: item.scheduledFor ? 'SCHEDULED' : 'PENDING',
      },
    });

    return successResponse(updated, 'Content approved');
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
