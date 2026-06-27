import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

// GET /api/ai/approvals?status=PENDING|APPROVED|REJECTED|ALL
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const status = request.nextUrl.searchParams.get('status') || 'PENDING';

    const where: any = { userId: auth.id };
    if (status !== 'ALL') where.approvalStatus = status;

    const generations = await prisma.aIGeneration.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            jobTitle: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const counts = await prisma.aIGeneration.groupBy({
      by: ['approvalStatus'],
      where: { userId: auth.id },
      _count: true,
    });

    const summary = { PENDING: 0, APPROVED: 0, REJECTED: 0, SENT: 0 };
    counts.forEach((c) => { (summary as any)[c.approvalStatus] = c._count; });

    return successResponse({ generations, summary });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
