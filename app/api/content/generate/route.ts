import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { ContentGenerationPipelineService } from '@/lib/services/content-generation-pipeline.service';
import { z } from 'zod';

const generateContentSchema = z.object({
  type: z.string().min(1),
  topic: z.string().min(1),
  tone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await verifyAuth(request);
    const { type, topic, tone } = generateContentSchema.parse(await request.json());

    const content = await ContentGenerationPipelineService.generateContent(
      type,
      { topic },
      tone || 'professional'
    );

    return successResponse({ content });
  } catch (error: any) {
    console.error(error); return errorResponse('An unexpected error occurred', 500);
  }
}
