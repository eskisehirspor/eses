import { describe, expect, it } from 'vitest';
import { resolveAdminAccess } from '@eskisehirspor/shared';

describe('admin route access', () => {
  it('separates unauthenticated, unauthorized, and authorized', () => {
    expect(resolveAdminAccess({ hasSession: false, roles: [] })).toBe('unauthenticated');
    expect(resolveAdminAccess({ hasSession: true, roles: ['user'] })).toBe('unauthorized');
    expect(resolveAdminAccess({ hasSession: true, roles: ['admin'] })).toBe('authorized');
  });
});
