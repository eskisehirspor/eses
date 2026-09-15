import { z } from 'zod';

export const ROLES = ['user', 'moderator', 'editor', 'admin', 'super_admin'] as const;

export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

export const STAFF_ROLES = ['moderator', 'editor', 'admin', 'super_admin'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const DEFAULT_ROLE: Role = 'user';

export function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}

export function isStaffRole(role: Role): role is StaffRole {
  return (STAFF_ROLES as readonly Role[]).includes(role);
}

export function hasStaffAccess(roles: readonly Role[]): boolean {
  return roles.some(isStaffRole);
}

/** Clients must never treat this as a writable field. */
export const CLIENT_FORBIDDEN_ROLE_MUTATIONS = ['insert', 'update', 'delete'] as const;
