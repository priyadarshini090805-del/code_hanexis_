import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';

// POST /api/integrations/connect/[provider]
export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    const provider = params.provider.toUpperCase();
    if (!['LINKEDIN', 'INSTAGRAM'].includes(provider)) {
      return NextResponse.json(
        errorResponse('Invalid provider'),
        { status: 400 }
      );
    }

    const body = await request.json();
    const { accessToken, refreshToken, expiresIn } = body;

    // Check if integration already exists
    let integration = await prisma.integration.findUnique({
      where: {
        userId_provider: {
          userId: auth.id,
          provider: provider as any,
        },
      },
      include: { tokens: true },
    });

    if (!integration) {
      integration = await prisma.integration.create({
        data: {
          userId: auth.id,
          provider: provider as any,
          status: 'ACTIVE',
          connectedAt: new Date(),
          tokens: {
            create: {
              accessToken,
              refreshToken,
              expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
            },
          },
        },
        include: { tokens: true },
      });
    } else {
      // Update existing integration
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
      await prisma.integrationToken.updateMany({
        where: { integrationId: integration.id },
        data: { accessToken, refreshToken, expiresAt },
      });

      integration = await prisma.integration.update({
        where: { id: integration.id },
        data: { status: 'ACTIVE' },
        include: { tokens: true },
      });
    }

    return NextResponse.json(
      successResponse('Integration connected', { integration })
    );
  } catch (error: any) {
    console.error('POST /api/integrations/connect/[provider] error:', error);
    return NextResponse.json(
      errorResponse(error.message),
      { status: 500 }
    );
  }
}
