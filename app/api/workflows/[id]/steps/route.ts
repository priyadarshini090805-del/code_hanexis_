import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const step = await prisma.workflowStep.create({
      data: {
        workflowId: id,
        type: body.type,
        stepNumber: body.stepNumber,
        delayMinutes: body.delayMinutes ?? null,
        messageTemplate: body.messageTemplate ?? null,
        condition: body.condition ?? null,
      },
    });

    return successResponse(step, 'Step added successfully');
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
    const searchParams = request.nextUrl.searchParams;
    const stepId = searchParams.get('stepId');

    if (!stepId) {
      return errorResponse('Missing stepId', 400);
    }

    const workflow = await prisma.workflow.findFirst({
      where: { id, userId: payload.id },
    });

    if (!workflow) {
      return errorResponse('Workflow not found', 404);
    }

    await prisma.workflowStep.delete({
      where: { id: stepId },
    });

    return successResponse(null, 'Step deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
