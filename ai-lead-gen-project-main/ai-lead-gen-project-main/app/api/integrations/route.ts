import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { IntegrationService } from '@/lib/services/integration.service';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const integrations = await IntegrationService.getIntegrations(auth.id);

    return successResponse('Integrations retrieved', { integrations });
  } catch (error: any) {
    console.error('GET /api/integrations error:', error);
    return errorResponse(error.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const schema = z.object({
      provider: z.enum(['LINKEDIN', 'INSTAGRAM']),
      accessToken: z.string(),
      refreshToken: z.string().optional(),
      expiresIn: z.number().optional(),
    });

    const { provider, accessToken, refreshToken, expiresIn } = schema.parse(body);

    let integration;
    if (provider === 'LINKEDIN') {
      integration = await IntegrationService.connectLinkedIn(
        auth.id,
        accessToken,
        refreshToken,
        expiresIn
      );
    } else {
      integration = await IntegrationService.connectInstagram(
        auth.id,
        accessToken,
        refreshToken,
        expiresIn
      );
    }

    return NextResponse.json(
      successResponse('Integration connected', { integration }),
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation error', error.errors, 400);
    }
    console.error('POST /api/integrations error:', error);
    return errorResponse(error.message, 500);
  }
}
