import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import type { WorkflowExecutionStatus } from '@/lib/enums';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const status = request.nextUrl.searchParams.get('status');

    // Scope to the user's own workflows (WorkflowExecution stores scalar ids).
    const workflows = await prisma.workflow.findMany({
      where: { userId: payload.id },
      select: { id: true, name: true },
    });
    const workflowIds = workflows.map((w) => w.id);
    const nameById = new Map(workflows.map((w) => [w.id, w.name]));

    const executions = await prisma.workflowExecution.findMany({
      where: {
        workflowId: { in: workflowIds },
        ...(status ? { status: status as WorkflowExecutionStatus } : {}),
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    return successResponse(
      executions.map((e) => ({ ...e, workflowName: nameById.get(e.workflowId) ?? null }))
    );
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
