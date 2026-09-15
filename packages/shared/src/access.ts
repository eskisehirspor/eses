import { hasStaffAccess, type Role } from './roles';

export const ADMIN_ACCESS_STATES = [
  'unauthenticated',
  'unauthorized',
  'authorized',
] as const;

export type AdminAccessState = (typeof ADMIN_ACCESS_STATES)[number];

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
