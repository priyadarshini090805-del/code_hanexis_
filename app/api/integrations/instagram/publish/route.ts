import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { InstagramService } from '@/lib/services/instagram.service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const publishSchema = z.object({
  caption: z.string().min(1).max(2200),
  imageUrl: z.string().url(),
  hashtags: z.array(z.string()).optional(),
  schedule: z.boolean().optional(),
  scheduledTime: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    const body = publishSchema.parse(await request.json());
    const { caption, imageUrl, hashtags, schedule, scheduledTime } = body;

    const validationError = InstagramService.validateMedia(imageUrl, caption);
    if (validationError) {
      return errorResponse(validationError, 400);
    }

    let result: string;

    if (schedule && scheduledTime) {
      result = await InstagramService.schedulePost(
        auth.id,
        null,
        caption,
        imageUrl,
        new Date(scheduledTime)
      );
      logger.info('Instagram post scheduled', { subsystem: 'instagram', userId: auth.id, scheduledFor: scheduledTime });
    } else {
      result = await InstagramService.publishPost(
        auth.id,
        null,
        caption,
        imageUrl,
        hashtags
      );
    }

    return successResponse({ postId: result }, schedule ? 'Post scheduled' : 'Post published');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation error', error.errors, 400);
    }
    logger.error('Instagram publish route error', { subsystem: 'instagram', error: error.message });
    return errorResponse('An unexpected error occurred', 500);
  }
}
