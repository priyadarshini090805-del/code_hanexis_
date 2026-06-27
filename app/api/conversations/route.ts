import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { ConversationService } from '@/lib/services/conversation.service';
import { z } from 'zod';

const createConversationSchema = z.object({
  leadId: z.string().min(1),
  platform: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform');

    const conversations = await ConversationService.getUserConversations(
      payload.id,
      platform || undefined
    );

    return successResponse(conversations);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const { leadId, platform } = createConversationSchema.parse(await request.json());

    const conversation = await ConversationService.getOrCreateConversation(
      payload.id,
      leadId,
      platform
    );

    return successResponse(conversation, 'Conversation created');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
