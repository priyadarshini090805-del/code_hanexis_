import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { verifyTOTP } from '@/lib/auth/totp';

// POST /api/auth/2fa/verify
// Body: { token: "123456" }
// Verifies the TOTP token during setup (enables 2FA) or during login (grants access)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const body = await request.json();
    const { token, mode = 'setup' } = body as { token: string; mode?: 'setup' | 'login' };

    if (!token || !/^\d{6}$/.test(token)) {
      return errorResponse('Token must be a 6-digit number', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });
    if (!user) return errorResponse('User not found', 404);
    if (!user.twoFactorSecret) return errorResponse('2FA setup not started. Call /api/auth/2fa/setup first', 400);

    const valid = verifyTOTP(user.twoFactorSecret, token);
    if (!valid) return errorResponse('Invalid or expired token', 401);

    if (mode === 'setup') {
      // Activate 2FA
      await prisma.user.update({
        where: { id: auth.id },
        data: { twoFactorEnabled: true },
      });
      return successResponse({ enabled: true }, '2FA enabled successfully');
    }

    // Login mode — just confirm it's valid; session management handled by caller
    return successResponse({ verified: true }, '2FA verified');
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
