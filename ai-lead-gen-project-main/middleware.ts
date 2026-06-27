import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTE: Rate limiting is intentionally NOT done in middleware. This runs on the
// Edge runtime, where in-memory state resets every serverless invocation (a
// Map-based limiter is a no-op) and Prisma is unavailable. Abuse-prone routes
// use the DB-backed limiter (lib/security/rate-limit.ts) at the route level —
// see /api/auth/register and /api/ai/generate-message. Login is guarded by
// brute-force protection (lib/security/brute-force.ts).

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // CSP Headers
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\n/g, '');
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
