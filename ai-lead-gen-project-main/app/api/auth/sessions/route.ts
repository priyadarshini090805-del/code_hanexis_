import { NextRequest } from 'next/server'
import { verifyToken, getTokenFromRequest } from '@/lib/auth/crypto'
import { verifyAuth } from '@/lib/auth/verify'
import { unauthorizedResponse, successResponse, internalErrorResponse } from '@/lib/api-response'
import { getSessionMetrics, deleteSession, revokeAllDeviceSessions } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)

    const decoded = await verifyAuth(request).catch(() => null)
    if (!decoded) {
      return unauthorizedResponse('Invalid or expired token')
    }

    const metrics = await getSessionMetrics(decoded.id)

    return successResponse(metrics)
  } catch (error) {
    console.error('Get sessions error:', error)
    return internalErrorResponse('Failed to fetch sessions')
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)

    const decoded = await verifyAuth(request).catch(() => null)
    if (!decoded) {
      return unauthorizedResponse('Invalid or expired token')
    }

    const body = await request.json().catch(() => ({}))
    const sessionId = body.sessionId as string
    const logoutAllDevices = body.logoutAllDevices as boolean

    if (logoutAllDevices) {
      await revokeAllDeviceSessions(decoded.id)
      return successResponse(null, 'Logged out from all devices')
    }

    if (sessionId) {
      await deleteSession(sessionId)
      return successResponse(null, 'Session deleted')
    }

    return unauthorizedResponse('No session ID provided')
  } catch (error) {
    console.error('Delete session error:', error)
    return internalErrorResponse('Failed to delete session')
  }
}
