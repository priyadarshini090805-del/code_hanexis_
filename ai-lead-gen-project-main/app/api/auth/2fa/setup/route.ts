import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { generateTOTPSecret, generateOTPAuthURI } from '@/lib/auth/totp';

// POST /api/auth/2fa/setup
// Generates a new TOTP secret and returns the OTPAuth URI for QR code display.
// The secret is saved to the user but 2FA is NOT enabled until they verify.
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { email: true, twoFactorEnabled: true },
    });
    if (!user) return errorResponse('User not found', 404);
    if (user.twoFactorEnabled) return errorResponse('2FA is already enabled', 400);

    const secret = generateTOTPSecret();
    const uri = generateOTPAuthURI(secret, user.email || auth.id);

    // Store the secret (not yet active until verified)
    await prisma.user.update({
      where: { id: auth.id },
      data: { twoFactorSecret: secret },
    });

    return successResponse({ secret, uri }, 'Scan the QR code, then verify with your authenticator app');
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
