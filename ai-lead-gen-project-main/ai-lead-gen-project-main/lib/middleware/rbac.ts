import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/crypto'
import { hasPermission, canAccessResource, UserRole } from '@/lib/rbac'
import { unauthorizedResponse } from '@/lib/api-response'

export interface RBACRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: string
  }
}

export function withRoleCheck(...requiredRoles: UserRole[]) {
  return (handler: (request: RBACRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

      if (!token) {
        return unauthorizedResponse('No token provided')
      }

      const decoded = verifyToken(token)
      if (!decoded) {
        return unauthorizedResponse('Invalid or expired token')
      }

      if (!canAccessResource(decoded.role as UserRole, requiredRoles)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      const rbacRequest = request as RBACRequest
      rbacRequest.user = decoded

      return handler(rbacRequest)
    }
  }
}

export function withPermissionCheck(...requiredPermissions: string[]) {
  return (handler: (request: RBACRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

      if (!token) {
        return unauthorizedResponse('No token provided')
      }

      const decoded = verifyToken(token)
      if (!decoded) {
        return unauthorizedResponse('Invalid or expired token')
      }

      const userRole = decoded.role as UserRole
      const hasRequiredPermission = requiredPermissions.some(
        (permission) => hasPermission(userRole, permission)
      )

      if (!hasRequiredPermission) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      const rbacRequest = request as RBACRequest
      rbacRequest.user = decoded

      return handler(rbacRequest)
    }
  }
}
