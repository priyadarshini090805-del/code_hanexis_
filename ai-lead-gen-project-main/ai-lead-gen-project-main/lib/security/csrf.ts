import crypto from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const CSRF_COOKIE_NAME = 'x-csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function setCSRFTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be accessible to JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  })
}

export async function getCSRFTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value
}

export async function getCSRFTokenFromHeader(request: NextRequest): Promise<string | null> {
  // Only read from header — reading from body here would consume it and break the route handler
  return request.headers.get(CSRF_HEADER_NAME)
}

export async function verifyCSRFToken(token: string, cookieToken: string): Promise<boolean> {
  if (!token || !cookieToken) return false
  if (token.length !== 64 || cookieToken.length !== 64) return false
  const tokenBuf = Buffer.from(token)
  const cookieBuf = Buffer.from(cookieToken)
  return crypto.timingSafeEqual(tokenBuf, cookieBuf)
}

export async function validateCSRFRequest(request: NextRequest): Promise<{ valid: boolean; token?: string }> {
  const method = request.method.toUpperCase()

  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return { valid: true }
  }

  const headerToken = await getCSRFTokenFromHeader(request)
  const cookieToken = await getCSRFTokenFromCookie()

  if (!headerToken || !cookieToken) {
    return { valid: false }
  }

  const valid = await verifyCSRFToken(headerToken, cookieToken)
  return { valid }
}

export function csrfMiddleware(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const method = request.method.toUpperCase()

    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return handler(request)
    }

    const { valid } = await validateCSRFRequest(request)

    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      )
    }

    return handler(request)
  }
}
