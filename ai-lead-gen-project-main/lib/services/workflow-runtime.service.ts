import { prisma } from '@/lib/prisma';
import { addOutreachJob } from '@/lib/queue';

/**
 * Durable, database-driven workflow engine.
 *
 * Each execution is a WorkflowExecution row (status + currentStep + nextRunAt).
 * The engine advances one step per tick; DELAY steps set nextRunAt into the
 * future, so a delayed workflow survives server restarts/redeploys (state lives
 * in the DB, not in a runtime loop). The cron (/api/cron/process-scheduled)
 * calls tick() to drive due executions.
 *
 * Supports pause / resume / cancel / retry via the execution status.
 */
export class WorkflowRuntimeService {
  /** Start a durable execution for a (campaign, lead, workflow). Returns the execution id. */
  static async startExecution(campaignId: string, leadId: string, workflowId: string): Promise<string> {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });
    if (!workflow || workflow.steps.length === 0) {
      throw new Error('Workflow not found or has no steps');
    }
    // Ensure a CampaignLead exists for tracking.
    await prisma.campaignLead.upsert({
      where: { campaignId_leadId: { campaignId, leadId } },
      update: {},
      create: { campaignId, leadId, status: 'PENDING' },
    });
    const exec = await prisma.workflowExecution.create({
      data: { workflowId, campaignId, leadId, status: 'RUNNING', currentStep: 0, nextRunAt: new Date() },
    });
    return exec.id;
  }

  /**
   * Advance all due executions by one step. Returns a summary array.
   * Idempotent and safe to call repeatedly (e.g. from cron).
   */
  static async tick(limit = 50): Promise<any[]> {
    const now = new Date();
    const due = await prisma.workflowExecution.findMany({
      where: { status: 'RUNNING', OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }] },
      take: limit,
      orderBy: { updatedAt: 'asc' },
    });
    const results: any[] = [];
    for (const exec of due) {
      try {
        results.push(await this.advanceOne(exec));
      } catch (e: any) {
        await prisma.workflowExecution.update({
          where: { id: exec.id },
          data: { status: 'FAILED', error: (e.message || 'error').slice(0, 900) },
        });
        results.push({ id: exec.id, status: 'failed', error: e.message });
      }
    }
    return results;
  }

  private static async advanceOne(exec: any) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: exec.workflowId },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });
    if (!workflow) throw new Error('Workflow not found');
    const steps = workflow.steps;

    // No more steps -> complete.
    if (exec.currentStep >= steps.length) {
      await prisma.workflowExecution.update({
        where: { id: exec.id },
        data: { status: 'COMPLETED', completedAt: new Date(), nextRunAt: null },
      });
      return { id: exec.id, action: 'completed' };
    }

    const step = steps[exec.currentStep];
    const lead = await prisma.lead.findUnique({ where: { id: exec.leadId } });
    if (!lead) throw new Error('Lead not found');

    switch (step.type) {
      case 'MESSAGE': {
        await addOutreachJob({
          campaignId: exec.campaignId,
          leadId: exec.leadId,
          workflowId: exec.workflowId,
          message: step.messageTemplate || undefined,
        });
        return this.next(exec, exec.currentStep + 1, new Date(), 'message_enqueued');
      }
      case 'DELAY': {
        // Durable delay: advance the step pointer but schedule the next run in
        // the future. Survives restarts because nextRunAt is persisted.
        const ms = (step.delayMinutes || 0) * 60 * 1000;
        return this.next(exec, exec.currentStep + 1, new Date(Date.now() + ms), `delayed_${step.delayMinutes || 0}m`);
      }
      case 'CONDITION': {
        const met = await this.evaluateCondition(exec, step.condition || '');
        // If condition is NOT met, skip the next step (simple branch semantics).
        const nextStep = met ? exec.currentStep + 1 : exec.currentStep + 2;
        return this.next(exec, nextStep, new Date(), `condition_${met ? 'met' : 'skip'}`);
      }
      case 'BRANCH': {
        // The preceding CONDITION step already handled skip routing; continue.
        return this.next(exec, exec.currentStep + 1, new Date(), 'branch');
      }
      default:
        return this.next(exec, exec.currentStep + 1, new Date(), 'skip_unknown');
    }
  }

  private static async next(exec: any, nextStep: number, nextRunAt: Date, action: string) {
    await prisma.workflowExecution.update({
      where: { id: exec.id },
      data: { currentStep: nextStep, nextRunAt },
    });
    return { id: exec.id, action, currentStep: nextStep };
  }

  /** Evaluate a condition against the lead's real engagement state. */
  private static async evaluateCondition(exec: any, condition: string): Promise<boolean> {
    const c = (condition || '').toLowerCase();
    const cl = await prisma.campaignLead.findUnique({
      where: { campaignId_leadId: { campaignId: exec.campaignId, leadId: exec.leadId } },
    });
    if (cl) {
      if (c.includes('replied')) return cl.repliedAt != null;
      if (c.includes('opened')) return cl.openedAt != null;
      if (c.includes('sent')) return cl.sentAt != null;
    }
    const lead = await prisma.lead.findUnique({ where: { id: exec.leadId } });
    if (c.includes('qualified')) return lead?.status === 'QUALIFIED';
    if (c.includes('converted')) return lead?.status === 'CONVERTED';
    return true;
  }

  // --- Control actions (durable) ---
  static async pauseExecution(id: string) {
    return prisma.workflowExecution.updateMany({ where: { id, status: 'RUNNING' }, data: { status: 'PAUSED' } });
  }
  static async resumeExecution(id: string) {
    return prisma.workflowExecution.updateMany({ where: { id, status: 'PAUSED' }, data: { status: 'RUNNING', nextRunAt: new Date() } });
  }
  static async cancelExecution(id: string) {
    return prisma.workflowExecution.updateMany({
      where: { id, status: { in: ['RUNNING', 'PAUSED'] } },
      data: { status: 'CANCELLED', nextRunAt: null },
    });
  }
  static async retryExecution(id: string, fromStep?: number) {
    const exec = await prisma.workflowExecution.findUnique({ where: { id } });
    if (!exec) throw new Error('Execution not found');
    return prisma.workflowExecution.update({
      where: { id },
      data: { status: 'RUNNING', error: null, currentStep: fromStep ?? exec.currentStep, nextRunAt: new Date(), completedAt: null },
    });
  }
  static async getExecutionStatus(id: string) {
    return prisma.workflowExecution.findUnique({ where: { id } });
  }

  /** Back-compat: kick off a durable execution (was a synchronous in-memory loop). */
  static async executeWorkflow(campaignId: string, leadId: string, workflowId: string): Promise<string> {
    return this.startExecution(campaignId, leadId, workflowId);
  }
}
