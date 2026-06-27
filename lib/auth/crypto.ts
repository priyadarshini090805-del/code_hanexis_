import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const SALT_ROUNDS = 10

function getJWTSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be set and at least 32 characters.')
  }
  return s
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash)
}

export interface TokenPayload {
  id: string
  email: string
  role: string
}

function getRefreshSecret(): string {
  const s = process.env.JWT_REFRESH_SECRET
  if (!s || s.length < 32) {
    throw new Error('FATAL: JWT_REFRESH_SECRET must be set and at least 32 characters.')
  }
  return s
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, type: 'access' }, getJWTSecret(), {
    expiresIn: '15m',
    algorithm: 'HS256',
  })
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, type: 'refresh' }, getRefreshSecret(), {
    expiresIn: '7d',
    algorithm: 'HS256',
  })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as TokenPayload & { type?: string }
    if (decoded.type && decoded.type !== 'access') return null
    return { id: decoded.id, email: decoded.email, role: decoded.role }
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, getRefreshSecret()) as TokenPayload & { type?: string }
    if (decoded.type && decoded.type !== 'refresh') return null
    return { id: decoded.id, email: decoded.email, role: decoded.role }
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

export function generateVerificationToken(): string {
  return jwt.sign(
    { timestamp: Date.now() },
    getJWTSecret(),
    {
      expiresIn: '24h',
      algorithm: 'HS256',
    }
  )
}

export function generatePasswordResetToken(): string {
  return jwt.sign(
    { timestamp: Date.now() },
    getJWTSecret(),
    {
      expiresIn: '1h',
      algorithm: 'HS256',
    }
  )
}

export function generateTwoFactorToken(userId: string): string {
  return jwt.sign({ userId, type: '2fa_pending' }, getJWTSecret(), {
    expiresIn: '5m',
    algorithm: 'HS256',
  })
}

export function verifyTwoFactorToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as { userId: string; type?: string }
    if (decoded.type !== '2fa_pending') return null
    return { userId: decoded.userId }
  } catch {
    return null
  }
}
