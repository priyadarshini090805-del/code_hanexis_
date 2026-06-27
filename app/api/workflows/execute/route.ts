import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { WorkflowRuntimeService } from '@/lib/services/workflow-runtime.service';
import { queue } from '@/lib/queue';

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const body = await request.json();
    const { campaignId, leadId, workflowId } = body;

    if (!campaignId || !leadId || !workflowId) {
      return errorResponse('Missing required fields', 400);
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: payload.id },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId: payload.id },
    });

    if (!lead) {
      return errorResponse('Lead not found', 404);
    }

    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, userId: payload.id },
    });

    if (!workflow) {
      return errorResponse('Workflow not found', 404);
    }

    // Start a durable execution; the cron-driven engine advances it step by
    // step (message/delay/condition/branch) and survives restarts.
    const executionId = await WorkflowRuntimeService.startExecution(campaignId, leadId, workflowId);
    const execution = await prisma.workflowExecution.findUnique({ where: { id: executionId } });

    return successResponse({ execution });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
