import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { verifyTOTP } from '@/lib/auth/totp';

// POST /api/auth/2fa/disable
// Body: { token: "123456" }  — must provide a valid current TOTP token to disable
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const body = await request.json().catch(() => ({}));
    const { token } = body as { token?: string };

    if (!token || !/^\d{6}$/.test(token)) {
      return errorResponse('Token must be a 6-digit number', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user) return errorResponse('User not found', 404);
    if (!user.twoFactorEnabled) return errorResponse('2FA is not enabled', 400);
    if (!user.twoFactorSecret) return errorResponse('No secret found', 400);

    const valid = verifyTOTP(user.twoFactorSecret, token);
    if (!valid) return errorResponse('Invalid token', 401);

    await prisma.user.update({
      where: { id: auth.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return successResponse({ enabled: false }, '2FA disabled');
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
