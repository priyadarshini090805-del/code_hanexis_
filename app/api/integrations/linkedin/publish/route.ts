import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { LinkedInService } from '@/lib/services/linkedin.service';
import { z } from 'zod';

const publishSchema = z.object({
  content: z.string(),
  action: z.enum(['post', 'message']).default('post'),
  recipientId: z.string().optional(),
  subject: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { content, action, recipientId, subject } = publishSchema.parse(body);

    const token = request.headers.get('x-linkedin-token');
    if (!token) {
      return errorResponse('LinkedIn token required', 400);
    }

    let result;

    if (action === 'message') {
      if (!recipientId) {
        return errorResponse('recipientId required for message', 400);
      }
      result = await LinkedInService.sendMessage(
        auth.id,
        token,
        recipientId,
        content
      );
    } else {
      result = await LinkedInService.publishPost(auth.id, token, content);
    }

    return successResponse('LinkedIn publish completed', { postId: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation error', error.errors, 400);
    }
    console.error('LinkedIn publish error:', error);
    return errorResponse(error.message, 500);
  }
}
