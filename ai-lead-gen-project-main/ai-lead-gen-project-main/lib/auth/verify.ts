import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

function getJWTSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be set and at least 32 characters.');
  }
  return new TextEncoder().encode(s);
}

/**
 * Unified auth for API routes. Accepts, in order:
 *   1. NextAuth session cookie (Google / LinkedIn OAuth login)
 *   2. The `accessToken` cookie from credential login
 *   3. An `Authorization: Bearer <jwt>` header (API clients)
 * Throws if none are present/valid.
 */
export async function verifyAuth(request: NextRequest): Promise<TokenPayload> {
  // 1) NextAuth session
  try {
    const session = await auth();
    const u = session?.user as any;
    if (u?.id) return { id: u.id, email: u.email || '', role: u.role || 'USER' };
  } catch { /* fall through */ }

  // 2) accessToken cookie (credential login)
  try {
    const store = await cookies();
    const cookieToken = store.get('accessToken')?.value;
    if (cookieToken) {
      const { payload } = await jwtVerify(cookieToken, getJWTSecret());
      if (payload?.id) return await hydrate(payload);
    }
  } catch { /* fall through */ }

  // 3) Bearer header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const { payload } = await jwtVerify(authHeader.slice(7), getJWTSecret());
      if (payload?.id) return await hydrate(payload);
    } catch { /* fall through */ }
  }

  throw new Error('Authentication failed');
}

async function hydrate(payload: any): Promise<TokenPayload> {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { id: true, email: true, role: true },
    });
    if (dbUser) return dbUser;
  } catch { /* ignore */ }
  return { id: payload.id, email: payload.email || '', role: payload.role || 'USER' };
}
