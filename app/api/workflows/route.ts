import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const { name, description } = createWorkflowSchema.parse(await request.json());

    const workflow = await prisma.workflow.create({
      data: {
        userId: payload.id,
        name,
        description: description || '',
        isActive: true,
      },
    });

    return successResponse(workflow, 'Workflow created');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    const workflows = await prisma.workflow.findMany({
      where: {
        userId: payload.id,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { steps: true },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(workflows);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
