import { describe, expect, it } from 'vitest';
import { canOperateLiveMatch, canCorrectLiveMatch, resolveAdminAccess, resolveContentAccess } from '@eskisehirspor/shared';

describe('admin route access', () => {
  it('separates unauthenticated, unauthorized, and authorized', () => {
    expect(resolveAdminAccess({ hasSession: false, roles: [] })).toBe('unauthenticated');
    expect(resolveAdminAccess({ hasSession: true, roles: ['user'] })).toBe('unauthorized');
    expect(resolveAdminAccess({ hasSession: true, roles: ['admin'] })).toBe('authorized');
  });

  it('authorizes editors and admins for news CMS', () => {
    expect(resolveContentAccess({ hasSession: true, roles: ['editor'] })).toBe('authorized');
    expect(resolveContentAccess({ hasSession: true, roles: ['admin'] })).toBe('authorized');
  });

  it('keeps news CMS off-limits for users and moderators', () => {
    expect(resolveContentAccess({ hasSession: true, roles: ['user'] })).toBe('unauthorized');
    expect(resolveContentAccess({ hasSession: true, roles: ['moderator'] })).toBe('unauthorized');
  });

  it('keeps live match ops to admin and super admin', () => {
    expect(canOperateLiveMatch(['user'])).toBe(false);
    expect(canOperateLiveMatch(['moderator'])).toBe(false);
    expect(canOperateLiveMatch(['editor'])).toBe(false);
    expect(canOperateLiveMatch(['admin'])).toBe(true);
    expect(canCorrectLiveMatch(['admin'])).toBe(false);
    expect(canCorrectLiveMatch(['super_admin'])).toBe(true);
  });
});
