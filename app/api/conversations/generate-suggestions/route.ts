import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { ConversationService } from '@/lib/services/conversation.service';
import { z } from 'zod';

const suggestSchema = z.object({
  conversationId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { conversationId } = suggestSchema.parse(body);

    const suggestions = await ConversationService.generateReplySuggestions(auth.id, conversationId);

    return successResponse('Reply suggestions generated', { suggestions });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation error', error.errors, 400);
    }
    console.error('POST /api/conversations/generate-suggestions error:', error);
    return errorResponse(error.message, 500);
  }
}
