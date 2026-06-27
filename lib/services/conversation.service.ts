import { prisma } from '@/lib/prisma';
import { OpenRouterProvider } from '@/lib/ai/providers/openrouter';

export class ConversationService {
  /**
   * Generate up to 3 context-aware reply suggestions for a conversation.
   * Uses OpenRouter when configured; falls back to sensible canned replies
   * so the endpoint never 500s when no AI key is present.
   */
  static async generateReplySuggestions(userId: string, conversationId: string): Promise<string[]> {
    const conversation = await this.getConversationHistory(userId, conversationId, 12);

    const lead = (conversation as any).lead;
    const leadName = lead ? `${lead.firstName} ${lead.lastName}`.trim() : 'the lead';

    // messages come back newest-first; reverse to chronological for the prompt
    const history = [...conversation.messages].reverse();
    const transcript = history
      .map((m) => `${m.sender === 'lead' ? leadName : 'Me'}: ${m.content}`)
      .join('\n');

    const provider = new OpenRouterProvider();

    if (provider.isAvailable()) {
      const result = await provider.chat(
        [
          {
            role: 'system',
            content:
              'You are a sales/outreach assistant. Given a conversation transcript with a lead, ' +
              'propose exactly 3 short, professional, distinct reply options the user could send next. ' +
              'Return ONLY a JSON array of 3 strings, no extra text.',
          },
          {
            role: 'user',
            content:
              `Lead: ${leadName}${lead?.company ? ` at ${lead.company}` : ''}\n\n` +
              `Conversation so far:\n${transcript || '(no messages yet)'}\n\n` +
              'Reply suggestions (JSON array of 3 strings):',
          },
        ],
        { temperature: 0.7, maxTokens: 400 }
      );

      if (result.success && result.message) {
        const parsed = this.parseSuggestions(result.message);
        if (parsed.length) return parsed.slice(0, 3);
      }
    }

    return this.fallbackSuggestions(leadName);
  }

  private static parseSuggestions(raw: string): string[] {
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      const arr = JSON.parse(match ? match[0] : raw);
      if (Array.isArray(arr)) {
        return arr.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      // fall through to line-based parsing
    }
    return raw
      .split('\n')
      .map((l) => l.replace(/^\s*(?:\d+[.)]|[-*])\s*/, '').replace(/^["']|["']$/g, '').trim())
      .filter((l) => l.length > 0)
      .slice(0, 3);
  }

  private static fallbackSuggestions(leadName: string): string[] {
    const first = leadName.split(' ')[0] || 'there';
    return [
      `Thanks for getting back to me, ${first}! Would you be open to a quick 15-minute call this week?`,
      `Appreciate the reply. Happy to share more details — what's the best way to reach you?`,
      `Great to hear from you! Let me know if you have any questions I can help with.`,
    ];
  }

  static async getOrCreateConversation(userId: string, leadId: string, platform: string) {
    let conversation = await prisma.conversation.findFirst({
      where: { userId, leadId, platform },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          leadId,
          platform,
          lastMessageAt: new Date(),
        },
      });
    }

    return conversation;
  }

  static async sendMessage(
    userId: string,
    conversationId: string,
    sender: 'user' | 'lead',
    content: string,
    isAiSuggested: boolean = false
  ) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) throw new Error('Conversation not found');

    const message = await prisma.conversationMessage.create({
      data: {
        conversationId,
        sender,
        content,
        isAiSuggested,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        ...(sender === 'lead' ? { unreadCount: { increment: 1 } } : {}),
      },
    });

    return message;
  }

  static async getConversationHistory(userId: string, conversationId: string, limit: number = 50) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: limit },
        lead: true,
      },
    });

    if (!conversation) throw new Error('Conversation not found');
    return conversation;
  }

  static async getUserConversations(userId: string, platform?: string) {
    return await prisma.conversation.findMany({
      where: {
        userId,
        ...(platform && { platform }),
      },
      include: {
        lead: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  static async markAsRead(userId: string, conversationId: string) {
    return await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });
  }

  static async incrementUnread(conversationId: string, count: number = 1) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) return;

    return await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: (conversation.unreadCount || 0) + count },
    });
  }

  static async deleteConversation(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) throw new Error('Conversation not found');

    await prisma.conversationMessage.deleteMany({ where: { conversationId } });
    await prisma.conversation.delete({ where: { id: conversationId } });
  }

  static async searchConversations(userId: string, query: string) {
    return await prisma.conversation.findMany({
      where: {
        userId,
        lead: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
      },
      include: { lead: true },
    });
  }

  static async getUnreadConversations(userId: string) {
    return await prisma.conversation.findMany({
      where: {
        userId,
        unreadCount: { gt: 0 },
      },
      include: { lead: true },
    });
  }
}
