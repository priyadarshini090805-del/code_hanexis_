import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

// POST /api/ai/approvals/[id]/approve
// Body: { editedMessage?: string }  — if provided, saves edited version
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
    if (gen.approvalStatus === 'SENT') return errorResponse('Message already sent', 400);

    const updated = await prisma.aIGeneration.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedMessage: body.editedMessage?.trim() || null,
      },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true, company: true } },
      },
    });

    return successResponse(updated, 'Message approved');
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
