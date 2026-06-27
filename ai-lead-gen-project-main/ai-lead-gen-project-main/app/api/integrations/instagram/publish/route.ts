import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { InstagramService } from '@/lib/services/instagram.service';
import { z } from 'zod';

const publishSchema = z.object({
  caption: z.string(),
  imageUrl: z.string().url(),
  hashtags: z.array(z.string()).optional(),
  schedule: z.boolean().optional(),
  scheduledTime: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const { caption, imageUrl, hashtags, schedule, scheduledTime } = publishSchema.parse(body);

    const token = request.headers.get('x-instagram-token');
    if (!token) {
      return errorResponse('Instagram token required', 400);
    }

    let result;

    if (schedule && scheduledTime) {
      result = await InstagramService.schedulePost(
        auth.id,
        token,
        caption,
        imageUrl,
        new Date(scheduledTime)
      );
    } else {
      result = await InstagramService.publishPost(
        auth.id,
        token,
        caption,
        imageUrl,
        hashtags
      );
    }

    return successResponse('Instagram publish completed', { postId: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation error', error.errors, 400);
    }
    console.error('Instagram publish error:', error);
    return errorResponse(error.message, 500);
  }
}
