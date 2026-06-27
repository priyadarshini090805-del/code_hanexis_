import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

// POST /api/scheduler/[id]/reject
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
    if (item.status === 'PUBLISHED') return errorResponse('Cannot reject a published post', 400);

    const updated = await prisma.scheduledContent.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        rejectedAt: new Date(),
        approvalNotes: body.notes?.trim() || null,
        status: 'CANCELLED',
      },
    });

    return successResponse(updated, 'Content rejected');
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
