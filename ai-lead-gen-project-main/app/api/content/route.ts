import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { ContentGenerationPipelineService } from '@/lib/services/content-generation-pipeline.service';

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const json = await request.json();
    const { title, body, type } = json;

    if (!title || !body) {
      return errorResponse('Missing required fields', 400);
    }

    const content = await prisma.content.create({
      data: {
        userId: payload.id,
        title,
        body,
        type: type || 'POST',
      },
    });

    await prisma.contentVersion.create({
      data: {
        contentId: content.id,
        body,
        versionNumber: 1,
      },
    });

    return successResponse(content, 'Content saved successfully');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const contents = await prisma.content.findMany({
      where: { userId: payload.id },
      include: { versions: true },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(contents);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
