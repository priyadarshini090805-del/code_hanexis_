import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { ContentGenerationPipelineService } from '@/lib/services/content-generation-pipeline.service';

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const body = await request.json();
    const { type, topic, tone } = body;

    if (!type || !topic) {
      return errorResponse('Missing required fields', 400);
    }

    const content = await ContentGenerationPipelineService.generateContent(
      type,
      { topic },
      tone || 'professional'
    );

    return successResponse({ content });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
