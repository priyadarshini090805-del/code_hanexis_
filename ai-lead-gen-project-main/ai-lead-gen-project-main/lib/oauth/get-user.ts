import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';
import { verifyAuth } from '@/lib/auth/verify';

/**
 * Resolve the current user from (in order):
 * 1. Bearer JWT header  2. `?token=` query param (for browser OAuth redirects)  3. NextAuth session
 */
export async function getRequestUserId(request: NextRequest): Promise<string | null> {
  try {
    const payload = await verifyAuth(request);
    if (payload?.id) return payload.id;
  } catch { /* fall through */ }

  const queryToken = request.nextUrl.searchParams.get('token');
  if (queryToken) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
      const verified = await jwtVerify(queryToken, secret);
      if (verified.payload.id) return verified.payload.id as string;
    } catch { /* fall through */ }
  }

  try {
    const session = await auth();
    if (session?.user) return (session.user as any).id || null;
  } catch { /* fall through */ }
  return null;
}
