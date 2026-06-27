import type { UserRole } from '@/lib/enums';

/** Emails listed in ADMIN_EMAILS (comma-separated) are granted ADMIN on signup/login. */
export function resolveRole(email: string | null | undefined): UserRole {
  if (!email) return 'USER';
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase()) ? 'ADMIN' : 'USER';
}

const RANK: Record<string, number> = {
  USER: 0, SALES: 1, MANAGER: 2, ADMIN: 3, SUPER_ADMIN: 4,
};

/** True if `role` meets or exceeds `min`. */
export function hasRole(role: string | undefined, min: UserRole): boolean {
  return (RANK[role ?? 'USER'] ?? 0) >= (RANK[min] ?? 0);
}
