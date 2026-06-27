import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth/crypto'
import { unauthorizedResponse, successResponse, internalErrorResponse } from '@/lib/api-response'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const refreshTokenFromBody = body.refreshToken

    const cookieStore = await cookies()
    const refreshTokenFromCookie = cookieStore.get('refreshToken')?.value

    const refreshToken = refreshTokenFromBody || refreshTokenFromCookie

    if (!refreshToken) {
      return unauthorizedResponse('No refresh token provided')
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!storedToken || storedToken.revokedAt) {
      return unauthorizedResponse('Invalid or revoked refresh token')
    }

    if (new Date() > storedToken.expiresAt) {
      return unauthorizedResponse('Refresh token has expired')
    }

    const decoded = verifyRefreshToken(refreshToken)
    if (!decoded) {
      return unauthorizedResponse('Invalid refresh token')
    }

    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
    })

    if (!user || !user.isActive) {
      return unauthorizedResponse('User not found or inactive')
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    const newAccessToken = generateAccessToken(tokenPayload)
    const newRefreshToken = generateRefreshToken(tokenPayload)

    // Revoke old token and create new one atomically
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ])

    const newCookieStore = await cookies()
    newCookieStore.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    })
    newCookieStore.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return successResponse(
      {
        refreshed: true,
      },
      'Token refreshed successfully'
    )
  } catch (error) {
    console.error('Token refresh error:', error)
    return internalErrorResponse('Failed to refresh token')
  }
}
