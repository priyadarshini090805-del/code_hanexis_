import { UserRole, hasPermission, hasAllPermissions, hasAnyPermission, canAccessResource } from '../rbac'

describe('RBAC System', () => {
  describe('Permission Checking', () => {
    it('should check if role has specific permission', () => {
      expect(hasPermission(UserRole.ADMIN, 'users:read')).toBe(true)
      expect(hasPermission(UserRole.USER, 'users:read')).toBe(false)
    })

    it('should check if role has any of multiple permissions', () => {
      expect(hasAnyPermission(UserRole.SALES, ['leads:read', 'leads:create'])).toBe(true)
      expect(hasAnyPermission(UserRole.SALES, ['users:read', 'users:create'])).toBe(false)
    })

    it('should check if role has all of multiple permissions', () => {
      expect(hasAllPermissions(UserRole.ADMIN, ['users:read', 'users:create'])).toBe(true)
      expect(hasAllPermissions(UserRole.SALES, ['users:read', 'users:create'])).toBe(false)
    })
  })

  describe('Role Access Control', () => {
    it('should allow higher role to access lower role resources', () => {
      expect(canAccessResource(UserRole.ADMIN, UserRole.USER)).toBe(true)
      expect(canAccessResource(UserRole.SUPER_ADMIN, UserRole.ADMIN)).toBe(true)
    })

    it('should deny lower role to access higher role resources', () => {
      expect(canAccessResource(UserRole.USER, UserRole.ADMIN)).toBe(false)
      expect(canAccessResource(UserRole.SALES, UserRole.MANAGER)).toBe(false)
    })

    it('should allow role to access same role resources', () => {
      expect(canAccessResource(UserRole.ADMIN, UserRole.ADMIN)).toBe(true)
      expect(canAccessResource(UserRole.USER, UserRole.USER)).toBe(true)
    })

    it('should allow multiple role access', () => {
      expect(canAccessResource(UserRole.MANAGER, [UserRole.SALES, UserRole.USER])).toBe(true)
      expect(canAccessResource(UserRole.USER, [UserRole.ADMIN, UserRole.MANAGER])).toBe(false)
    })
  })

  describe('Permission Hierarchy', () => {
    it('should grant SUPER_ADMIN all permissions', () => {
      const adminPermissions = [
        'users:read',
        'users:create',
        'users:delete',
        'system:audit_logs',
        'leads:manage',
      ]

      adminPermissions.forEach((permission) => {
        expect(hasPermission(UserRole.SUPER_ADMIN, permission)).toBe(true)
      })
    })

    it('should grant ADMIN most permissions except system settings', () => {
      expect(hasPermission(UserRole.ADMIN, 'users:read')).toBe(true)
      expect(hasPermission(UserRole.ADMIN, 'leads:manage')).toBe(true)
      expect(hasPermission(UserRole.ADMIN, 'system:settings')).toBe(false)
    })

    it('should grant MANAGER limited permissions', () => {
      expect(hasPermission(UserRole.MANAGER, 'leads:manage')).toBe(true)
      expect(hasPermission(UserRole.MANAGER, 'users:read')).toBe(true)
      expect(hasPermission(UserRole.MANAGER, 'users:create')).toBe(false)
    })

    it('should grant SALES basic permissions', () => {
      expect(hasPermission(UserRole.SALES, 'leads:read')).toBe(true)
      expect(hasPermission(UserRole.SALES, 'outreach:read')).toBe(true)
      expect(hasPermission(UserRole.SALES, 'users:read')).toBe(false)
    })

    it('should grant USER minimal permissions', () => {
      expect(hasPermission(UserRole.USER, 'leads:read')).toBe(true)
      expect(hasPermission(UserRole.USER, 'outreach:read')).toBe(true)
      expect(hasPermission(UserRole.USER, 'leads:create')).toBe(false)
    })
  })
})
