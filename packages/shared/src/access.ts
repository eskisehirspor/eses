import { hasStaffAccess, type Role } from './roles';

export const ADMIN_ACCESS_STATES = [
  'unauthenticated',
  'unauthorized',
  'authorized',
] as const;

export type AdminAccessState = (typeof ADMIN_ACCESS_STATES)[number];

export const CONTENT_MANAGER_ROLES = ['editor', 'admin', 'super_admin'] as const;
export const OPS_ADMIN_ROLES = ['admin', 'super_admin'] as const;

export function resolveAdminAccess(input: {
  hasSession: boolean;
  roles: readonly Role[];
}): AdminAccessState {
  if (!input.hasSession) {
    return 'unauthenticated';
  }

  if (hasStaffAccess(input.roles)) {
    return 'authorized';
  }

  return 'unauthorized';
}

export function hasContentAccess(roles: readonly Role[]): boolean {
  return roles.some((role) => (CONTENT_MANAGER_ROLES as readonly Role[]).includes(role));
}

export function hasOpsAdminAccess(roles: readonly Role[]): boolean {
  return roles.some((role) => (OPS_ADMIN_ROLES as readonly Role[]).includes(role));
}

export function resolveContentAccess(input: {
  hasSession: boolean;
  roles: readonly Role[];
}): AdminAccessState {
  if (!input.hasSession) {
    return 'unauthenticated';
  }
  if (hasContentAccess(input.roles)) {
    return 'authorized';
  }
  return 'unauthorized';
}
