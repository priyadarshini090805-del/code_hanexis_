import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { CampaignService } from '@/lib/services/campaign.service';
import { CampaignExecutor } from '@/lib/services/campaign-executor.service';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['pause', 'resume', 'complete', 'add-leads', 'set-workflow', 'execute']),
  leadIds: z.array(z.string()).optional(),
  workflowId: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, leadIds, workflowId } = actionSchema.parse(body);

    let result: any;

    switch (action) {
      case 'pause':
        result = await CampaignService.pauseCampaign(params.id, auth.id);
        break;

      case 'resume':
        result = await CampaignService.resumeCampaign(params.id, auth.id);
        break;

      case 'complete':
        result = await CampaignService.completeCampaign(params.id, auth.id);
        break;

      case 'add-leads':
        if (!leadIds || leadIds.length === 0) {
          throw new Error('leadIds required for add-leads action');
        }
        result = await CampaignService.addLeadsToCampaign(params.id, leadIds, auth.id);
        break;

      case 'set-workflow':
        if (!workflowId) {
          throw new Error('workflowId required for set-workflow action');
        }
        result = await CampaignService.setWorkflow(params.id, workflowId, auth.id);
        break;

      case 'execute':
        const { prisma } = await import('@/lib/prisma');
        const leads = await prisma.campaignLead.findMany({
          where: { campaignId: params.id },
          select: { leadId: true },
        });
        const leadIdList = leads.map(l => l.leadId);
        result = await CampaignExecutor.executeCampaignWorkflow(params.id, leadIdList);
        break;

      default:
        throw new Error('Unknown action');
    }

    return NextResponse.json(
      successResponse(`Campaign ${action} successful`, { result })
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('Validation error', error.errors),
        { status: 400 }
      );
    }
    console.error('POST /api/campaigns/:id/actions error:', error);
    return NextResponse.json(
      errorResponse(error.message),
      { status: 400 }
    );
  }
}
