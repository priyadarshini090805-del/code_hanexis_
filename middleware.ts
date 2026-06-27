import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

// Routes exempt from CSRF: webhooks (HMAC-authenticated), crons (Bearer token),
// NextAuth (framework-managed), 2fa/login-verify (JWT token, not session),
// auth/refresh (uses refresh token), auth/logout (idempotent cookie clear).
const CSRF_EXEMPT_PREFIXES = [
  '/api/webhooks/',
  '/api/cron/',
  '/api/auth/[...nextauth]',
  '/api/auth/2fa/login-verify',
  '/api/auth/refresh',
  '/api/auth/logout',
];

function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PREFIXES.some(p => pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const method = request.method.toUpperCase();
  const pathname = request.nextUrl.pathname;

  // CSRF enforcement for mutating API requests
  if (
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
    pathname.startsWith('/api/') &&
    !isCsrfExempt(pathname)
  ) {
    const headerToken = request.headers.get('x-csrf-token');
    const cookieToken = request.cookies.get('x-csrf-token')?.value;

    if (headerToken && cookieToken && headerToken.length === 64 && cookieToken.length === 64) {
      const headerBuf = Buffer.from(headerToken);
      const cookieBuf = Buffer.from(cookieToken);
      if (!crypto.timingSafeEqual(headerBuf, cookieBuf)) {
        return NextResponse.json({ success: false, error: 'CSRF token validation failed' }, { status: 403 });
      }
    } else if (headerToken || cookieToken) {
      return NextResponse.json({ success: false, error: 'CSRF token validation failed' }, { status: 403 });
    }
    // If neither token is present, allow the request through — the route
    // may be called by server-side code or API clients that don't use cookies.
    // Routes that require browser-session CSRF (login, register) still have
    // their own csrfMiddleware wrapper as an additional layer.
  }

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
