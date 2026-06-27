export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SALES = 'SALES',
  USER = 'USER',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 5,
  [UserRole.ADMIN]: 4,
  [UserRole.MANAGER]: 3,
  [UserRole.SALES]: 2,
  [UserRole.USER]: 1,
}

export const PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:manage_roles',
    'system:audit_logs',
    'system:settings',
    'leads:read',
    'leads:create',
    'leads:update',
    'leads:delete',
    'leads:manage',
    'outreach:read',
    'outreach:create',
    'outreach:update',
    'outreach:delete',
    'reports:read',
    'reports:create',
  ],
  [UserRole.ADMIN]: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:manage_roles',
    'system:audit_logs',
    'leads:read',
    'leads:create',
    'leads:update',
    'leads:delete',
    'leads:manage',
    'outreach:read',
    'outreach:create',
    'outreach:update',
    'reports:read',
    'reports:create',
  ],
  [UserRole.MANAGER]: [
    'leads:read',
    'leads:create',
    'leads:update',
    'leads:manage',
    'outreach:read',
    'outreach:create',
    'outreach:update',
    'reports:read',
    'users:read',
  ],
  [UserRole.SALES]: [
    'leads:read',
    'leads:create',
    'leads:update',
    'outreach:read',
    'outreach:create',
    'outreach:update',
    'reports:read',
  ],
  // In this product each USER owns their own workspace (all data is scoped by
  // userId), so a USER may fully manage their own leads/outreach/reports.
  // Admin-only capabilities (users:*, system:*) remain reserved for ADMIN+.
  [UserRole.USER]: [
    'leads:read',
    'leads:create',
    'leads:update',
    'leads:delete',
    'leads:manage',
    'outreach:read',
    'outreach:create',
    'outreach:update',
    'reports:read',
    'reports:create',
  ],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) || false
}

export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

export function hasAllPermissions(role: UserRole, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canAccessResource(
  userRole: UserRole,
  requiredRole: UserRole | UserRole[]
): boolean {
  if (Array.isArray(requiredRole)) {
    return requiredRole.some((role) => hasRole(userRole, role))
  }
  return hasRole(userRole, requiredRole)
}
