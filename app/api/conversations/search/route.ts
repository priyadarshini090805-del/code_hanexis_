import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { ConversationService } from '@/lib/services/conversation.service';
import { z } from 'zod';

const searchParamsSchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);

    const raw = {
      q: request.nextUrl.searchParams.get('q') || undefined,
      page: request.nextUrl.searchParams.get('page') || undefined,
      limit: request.nextUrl.searchParams.get('limit') || undefined,
    };

    const params = searchParamsSchema.parse(raw);

    const result = await ConversationService.searchConversations(
      payload.id,
      params.q,
      params.page,
      params.limit
    );

    return successResponse(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation error', error.errors, 400);
    }
    console.error(error);
    return errorResponse('An unexpected error occurred', 500);
  }
}
