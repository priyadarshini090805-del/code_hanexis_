import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return errorResponse('Workflow name is required', 400);
    }

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
