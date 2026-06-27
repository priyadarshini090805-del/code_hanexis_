import { TokenPayload } from '@/lib/auth/verify';
import { UserRole, hasPermission, canAccessResource } from '@/lib/rbac';

/**
 * Thrown when an authenticated user lacks the role/permission for a route.
 * Carries HTTP 403 so route handlers can translate it consistently.
 */
export class AuthorizationError extends Error {
  status = 403;
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

function roleOf(auth: Pick<TokenPayload, 'role'>): UserRole {
  return (auth?.role as UserRole) || UserRole.USER;
}

/** Throw AuthorizationError unless the user has (at least) one of the roles. */
export function requireRole(auth: Pick<TokenPayload, 'role'>, ...roles: UserRole[]): void {
  if (!canAccessResource(roleOf(auth), roles)) {
    throw new AuthorizationError();
  }
}

/** Throw AuthorizationError unless the user's role grants the permission. */
export function requirePermission(auth: Pick<TokenPayload, 'role'>, permission: string): void {
  if (!hasPermission(roleOf(auth), permission)) {
    throw new AuthorizationError();
  }
}
