import { describe, expect, it } from 'vitest';
import { resolveAdminAccess, resolveContentAccess, hasContentAccess } from './access';
import { ANALYTICS_EVENTS } from './analytics';
import { isSocialAuthConfigured } from './auth-providers';
import { MOBILE_TABS } from './navigation';
import {
  PROFILE_CLIENT_WRITABLE_FIELDS,
  ProfileUpdateSchema,
  SignInSchema,
} from './profile';
import { DEFAULT_ROLE, hasStaffAccess, isStaffRole, ROLES } from './roles';
import { XP_ACTION_KEYS } from './xp-actions';

describe('roles', () => {
  it('defaults new accounts to user', () => {
    expect(DEFAULT_ROLE).toBe('user');
    expect(ROLES).toContain('super_admin');
  });

  it('does not treat user as staff', () => {
    expect(isStaffRole('user')).toBe(false);
    expect(hasStaffAccess(['user'])).toBe(false);
    expect(hasStaffAccess(['user', 'admin'])).toBe(true);
  });
});

describe('admin access', () => {
  it('maps session and roles to explicit access states', () => {
    expect(resolveAdminAccess({ hasSession: false, roles: [] })).toBe('unauthenticated');
    expect(resolveAdminAccess({ hasSession: true, roles: ['user'] })).toBe('unauthorized');
    expect(resolveAdminAccess({ hasSession: true, roles: ['moderator'] })).toBe('authorized');
    expect(resolveAdminAccess({ hasSession: true, roles: ['editor'] })).toBe('authorized');
    expect(resolveAdminAccess({ hasSession: true, roles: ['admin'] })).toBe('authorized');
    expect(resolveAdminAccess({ hasSession: true, roles: ['super_admin'] })).toBe('authorized');
  });

  it('does not authorize based on an unauthenticated client role claim', () => {
    expect(resolveAdminAccess({ hasSession: false, roles: ['super_admin'] })).toBe(
      'unauthenticated',
    );
  });
});

describe('content manager access', () => {
  it('does not let a regular user or moderator manage news', () => {
    expect(resolveContentAccess({ hasSession: true, roles: ['user'] })).toBe('unauthorized');
    expect(resolveContentAccess({ hasSession: true, roles: ['moderator'] })).toBe('unauthorized');
    expect(hasContentAccess(['user'])).toBe(false);
  });

  it('authorizes editors and admins for news CMS', () => {
    expect(resolveContentAccess({ hasSession: true, roles: ['editor'] })).toBe('authorized');
    expect(resolveContentAccess({ hasSession: true, roles: ['admin'] })).toBe('authorized');
    expect(resolveContentAccess({ hasSession: false, roles: ['editor'] })).toBe('unauthenticated');
  });
});

describe('profile authorization assumptions', () => {
  it('limits client-writable profile fields', () => {
    expect(PROFILE_CLIENT_WRITABLE_FIELDS).toEqual([
      'display_name',
      'avatar_path',
      'preferred_locale',
      'theme_preference',
    ]);
    expect(PROFILE_CLIENT_WRITABLE_FIELDS).not.toContain('id');
  });

  it('rejects unknown profile fields', () => {
    const parsed = ProfileUpdateSchema.safeParse({ display_name: 'Kırmızı Siyah', role: 'admin' });
    expect(parsed.success).toBe(false);
  });

  it('validates sign-in payload', () => {
    expect(SignInSchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(false);
    expect(SignInSchema.safeParse({ email: 'taraftar@example.com', password: 'secret' }).success).toBe(
      true,
    );
  });
});

describe('navigation smoke', () => {
  it('keeps the five primary tabs in product order', () => {
    expect(MOBILE_TABS.map((tab) => tab.label)).toEqual([
      'HOME',
      'MAÇLAR',
      'TRİBÜN',
      'OYNA',
      'PROFİL',
    ]);
  });
});

describe('shared contracts', () => {
  it('includes the product analytics taxonomy', () => {
    expect(ANALYTICS_EVENTS).toContain('XP_earned');
    expect(ANALYTICS_EVENTS).toContain('match_presence_verified');
  });

  it('exposes XP action keys without implying client grants', () => {
    expect(XP_ACTION_KEYS).toContain('match_presence_verified');
  });

  it('keeps social auth disabled unless flags are explicit', () => {
    expect(isSocialAuthConfigured({ appleEnabled: false, googleEnabled: false })).toEqual({
      apple: false,
      google: false,
    });
  });
});
