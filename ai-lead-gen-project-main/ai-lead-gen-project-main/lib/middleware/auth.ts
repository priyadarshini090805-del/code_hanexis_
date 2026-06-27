import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getTokenFromRequest } from '@/lib/auth/crypto'
import { unauthorizedResponse } from '@/lib/api-response'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: string
  }
}

export function withAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const token = getTokenFromRequest(request)

    if (!token) {
      return unauthorizedResponse('No token provided')
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return unauthorizedResponse('Invalid or expired token')
    }

    // Add user to request
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = decoded

    return handler(authenticatedRequest)
  }
}

export function withRole(...allowedRoles: string[]) {
  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (request: AuthenticatedRequest) => {
      const user = request.user
      if (!user) {
        return unauthorizedResponse('Not authenticated')
      }

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return handler(request)
    }
  }
}

export function withAuthAndRole(roles: string[]) {
  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      const token = getTokenFromRequest(request)

      if (!token) {
        return unauthorizedResponse('No token provided')
      }

      const decoded = verifyToken(token)
      if (!decoded) {
        return unauthorizedResponse('Invalid or expired token')
      }

      if (!roles.includes(decoded.role)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = decoded

      return handler(authenticatedRequest)
    }
  }
}
