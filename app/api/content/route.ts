import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { ContentType } from '@prisma/client';

const createContentSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  type: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    const { title, body, type } = createContentSchema.parse(await request.json());

    const content = await prisma.content.create({
      data: {
        userId: payload.id,
        title,
        body,
        type: (type || 'POST') as ContentType,
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
