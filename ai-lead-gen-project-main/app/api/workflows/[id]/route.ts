import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: { id, userId: payload.id },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });

    if (!workflow) {
      return errorResponse('Workflow not found', 404);
    }

    return successResponse(workflow);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;
    const body = await request.json();

    const workflow = await prisma.workflow.findFirst({
      where: { id, userId: payload.id },
    });

    if (!workflow) {
      return errorResponse('Workflow not found', 404);
    }

    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        name: body.name || workflow.name,
        description: body.description || workflow.description,
        isActive: body.isActive !== undefined ? body.isActive : workflow.isActive,
      },
      include: { steps: true },
    });

    return successResponse(updated, 'Workflow updated');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: { id, userId: payload.id },
    });

    if (!workflow) {
      return errorResponse('Workflow not found', 404);
    }

    await prisma.workflowStep.deleteMany({ where: { workflowId: id } });
    await prisma.workflow.delete({ where: { id } });

    return successResponse(null, 'Workflow deleted');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
