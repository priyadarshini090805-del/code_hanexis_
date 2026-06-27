import { prisma } from '@/lib/prisma';
import { AIMessageType, MessageTone, MessageLength } from '@/lib/enums';
import { OpenRouterProvider } from './providers/openrouter';
import { GenerateMessageInput } from './providers/interface';

export interface LeadContext {
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  tags?: string[];
}

export interface GenerateResult {
  success: boolean;
  message: string;
  tokensUsed: number;
  error?: string;
}

const DAILY_GENERATION_LIMIT = 200;

export class AIService {
  private provider = new OpenRouterProvider();

  async generateMessage(
    userId: string,
    leadId: string,
    messageType: AIMessageType,
    tone: MessageTone,
    length: MessageLength,
    lead: LeadContext,
    productName: string,
    valueProposition: string
  ): Promise<GenerateResult> {
    // rate limit
    const usage = await this.getUsage(userId);
    if (usage.generationsToday >= DAILY_GENERATION_LIMIT) {
      return { success: false, message: '', tokensUsed: 0, error: 'Daily AI generation limit reached' };
    }

    const input: GenerateMessageInput = {
      leadName: `${lead.firstName} ${lead.lastName}`.trim(),
      company: lead.company,
      role: lead.jobTitle,
      painPoints: lead.tags?.join(', '),
      pastNotes: lead.notes,
      productName,
      valueProposition,
      messageType,
      tone,
      length,
    };

    let result;
    if (this.provider.isAvailable()) {
      result = await this.provider.generateMessage(input);
    } else {
      result = {
        success: true,
        message: this.fallbackMessage(input),
        tokensUsed: 0,
        error: undefined,
      };
    }

    if (!result.success || !result.message) {
      return { success: false, message: '', tokensUsed: 0, error: result.error || 'Generation failed' };
    }

    await prisma.aIGeneration.create({
      data: {
        userId,
        leadId,
        messageType,
        tone,
        length,
        prompt: JSON.stringify(input).slice(0, 8000),
        response: result.message,
        tokensUsed: result.tokensUsed,
        provider: this.provider.isAvailable() ? 'openrouter' : 'template',
      },
    }).catch((e) => console.error('AIGeneration log failed:', e));

    await this.incrementUsage(userId, result.tokensUsed);

    return { success: true, message: result.message, tokensUsed: result.tokensUsed };
  }

  async getUsage(userId: string) {
    const now = new Date();
    const startOfTomorrow = new Date(now); startOfTomorrow.setHours(24, 0, 0, 0);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    let usage = await prisma.aIUsage.findUnique({ where: { userId } });
    if (!usage) {
      usage = await prisma.aIUsage.create({
        data: { userId, dailyLimitResetAt: startOfTomorrow, monthlyLimitResetAt: startOfNextMonth },
      });
    }
    // reset windows
    const data: any = {};
    if (usage.dailyLimitResetAt <= now) {
      data.dailyTokensUsed = 0; data.generationsToday = 0; data.dailyLimitResetAt = startOfTomorrow;
    }
    if (usage.monthlyLimitResetAt <= now) {
      data.monthlyTokensUsed = 0; data.generationsThisMonth = 0; data.monthlyLimitResetAt = startOfNextMonth;
    }
    if (Object.keys(data).length) {
      usage = await prisma.aIUsage.update({ where: { userId }, data });
    }
    return usage;
  }

  private async incrementUsage(userId: string, tokens: number) {
    await prisma.aIUsage.update({
      where: { userId },
      data: {
        dailyTokensUsed: { increment: tokens },
        monthlyTokensUsed: { increment: tokens },
        generationsToday: { increment: 1 },
        generationsThisMonth: { increment: 1 },
      },
    }).catch(() => null);
  }

  async getGenerationHistory(userId: string, leadId?: string, limit = 10) {
    return prisma.aIGeneration.findMany({
      where: { userId, ...(leadId ? { leadId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, messageType: true, tone: true, length: true,
        response: true, tokensUsed: true, provider: true, createdAt: true,
      },
    });
  }

  private fallbackMessage(input: GenerateMessageInput): string {
    return `Hi ${input.leadName.split(' ')[0]},

I noticed your work${input.company ? ` at ${input.company}` : ''}${input.role ? ` as ${input.role}` : ''} and thought you might be interested in ${input.productName} — ${input.valueProposition}.

Would you be open to a quick chat?

Best regards`;
  }
}

export const aiService = new AIService();
