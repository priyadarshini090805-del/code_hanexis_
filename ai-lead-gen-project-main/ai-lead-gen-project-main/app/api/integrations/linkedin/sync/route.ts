import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { LinkedInService } from '@/lib/services/linkedin.service';
import { z } from 'zod';

const syncSchema = z.object({
  action: z.enum(['profile', 'connections', 'conversations']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { action } = syncSchema.parse(body);

    const token = request.headers.get('x-linkedin-token');
    if (!token) {
      return errorResponse('LinkedIn token required', 400);
    }

    let result;

    switch (action || 'profile') {
      case 'profile':
        result = await LinkedInService.syncProfile(auth.id, token);
        break;
      case 'connections':
        result = await LinkedInService.importConnections(auth.id, token);
        break;
      case 'conversations':
        result = await LinkedInService.syncConversations(auth.id, token);
        break;
      default:
        result = await LinkedInService.syncProfile(auth.id, token);
    }

    return successResponse('LinkedIn sync completed', { result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation error', error.errors, 400);
    }
    console.error('LinkedIn sync error:', error);
    return errorResponse(error.message, 500);
  }
}
