import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

// POST /api/ai/approvals/[id]/reject
// Body: { reason?: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const gen = await prisma.aIGeneration.findFirst({
      where: { id, userId: auth.id },
    });
    if (!gen) return errorResponse('Message not found', 404);
    if (gen.approvalStatus === 'SENT') return errorResponse('Cannot reject a sent message', 400);

    const updated = await prisma.aIGeneration.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: body.reason?.trim() || null,
      },
    });

    return successResponse(updated, 'Message rejected');
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
