import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

function secret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET || '');
}

/**
 * Resolve the current user on the SERVER (layouts, server components, route handlers)
 * from EITHER auth source:
 *   1. NextAuth session cookie (Google / LinkedIn OAuth)
 *   2. The custom `accessToken` cookie set by credential login
 * Returns null if not authenticated.
 */
export async function getServerUser(): Promise<SessionUser | null> {
  // 1) NextAuth (OAuth) session
  try {
    const session = await auth();
    const u = session?.user as any;
    if (u?.id) {
      return { id: u.id, email: u.email, role: u.role || 'USER', firstName: u.name?.split(' ')[0] };
    }
  } catch { /* ignore */ }

  // 2) Credential-login cookie
  try {
    const store = await cookies();
    const token = store.get('accessToken')?.value;
    if (token) {
      const { payload } = await jwtVerify(token, secret());
      if (payload?.id) {
        // Hydrate role/name from DB so it is always current.
        const dbUser = await prisma.user.findUnique({
          where: { id: payload.id as string },
          select: { id: true, email: true, role: true, firstName: true, lastName: true },
        });
        if (dbUser) return dbUser;
        return { id: payload.id as string, email: (payload.email as string) || '', role: (payload.role as string) || 'USER' };
      }
    }
  } catch { /* ignore */ }

  return null;
}
