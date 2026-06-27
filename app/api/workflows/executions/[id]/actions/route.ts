import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { requirePermission } from '@/lib/auth/authorize';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { WorkflowRuntimeService } from '@/lib/services/workflow-runtime.service';

/**
 * Control a durable workflow execution.
 * POST body: { action: 'pause' | 'resume' | 'cancel' | 'retry', fromStep?: number }
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAuth(request);
    requirePermission(auth, 'outreach:update');

    // Ownership check: the execution's campaign must belong to the user.
    const exec = await prisma.workflowExecution.findUnique({ where: { id: params.id } });
    if (!exec) return errorResponse('Execution not found', 404);
    const campaign = await prisma.campaign.findFirst({ where: { id: exec.campaignId, userId: auth.id } });
    if (!campaign) return errorResponse('Not found', 404);

    const { action, fromStep } = await request.json();
    switch (action) {
      case 'pause': await WorkflowRuntimeService.pauseExecution(params.id); break;
      case 'resume': await WorkflowRuntimeService.resumeExecution(params.id); break;
      case 'cancel': await WorkflowRuntimeService.cancelExecution(params.id); break;
      case 'retry': await WorkflowRuntimeService.retryExecution(params.id, fromStep); break;
      default: return errorResponse('Invalid action. Use pause | resume | cancel | retry', 400);
    }
    const updated = await WorkflowRuntimeService.getExecutionStatus(params.id);
    return successResponse(updated, `Execution ${action}`);
  } catch (error: any) {
    return errorResponse(error.message, error.status || 500);
  }
}
