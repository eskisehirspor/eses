import { describe, expect, it } from 'vitest';
import { resolveAdminAccess, resolveContentAccess, hasContentAccess } from './access';
import { ANALYTICS_EVENTS } from './analytics';
import { isSocialAuthConfigured } from './auth-providers';
import { MOBILE_TABS } from './navigation';
import {
  PROFILE_CLIENT_WRITABLE_FIELDS,
  ProfileUpdateSchema,
  SignInSchema,
  buildOwnProfileUpdate,
  pendingSignupDisplayName,
  placeholderDisplayName,
  resolveAppTheme,
} from './profile';
import { DEFAULT_ROLE, hasStaffAccess, isStaffRole, ROLES } from './roles';
import { XP_ACTION_KEYS } from './xp-actions';
import { CLUB_DISPLAY_NAME, displayTeamName } from './matches';

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

  it('whitelists own profile updates and keeps locale tr', () => {
    const payload = buildOwnProfileUpdate({
      display_name: '  Kırmızı Şimşek  ',
      theme_preference: 'dark',
    });
    expect(payload).toEqual({
      display_name: 'Kırmızı Şimşek',
      theme_preference: 'dark',
      preferred_locale: 'tr',
    });
    expect(payload).not.toHaveProperty('deleted_at');
    expect(payload).not.toHaveProperty('avatar_path');
    expect(() =>
      buildOwnProfileUpdate({ display_name: 'ab', theme_preference: 'dark' }),
    ).toThrow();
  });

  it('applies signup metadata only onto the trigger placeholder name', () => {
    const userId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    expect(placeholderDisplayName(userId)).toBe('Taraftara0eebc99');
    expect(
      pendingSignupDisplayName({
        userId,
        currentDisplayName: 'Taraftara0eebc99',
        metadata: { display_name: 'Tribün 16' },
      }),
    ).toBe('Tribün 16');
    expect(
      pendingSignupDisplayName({
        userId,
        currentDisplayName: 'Kırmızı Siyah',
        metadata: { display_name: 'Tribün 16' },
      }),
    ).toBeNull();
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

describe('club display name', () => {
  it('never shows ES ES to users', () => {
    expect(displayTeamName({ name: 'Eskişehirspor', short_name: 'ES ES', is_eskisehirspor: true })).toBe(
      CLUB_DISPLAY_NAME,
    );
    expect(displayTeamName({ name: 'ES ES', short_name: 'ES ES' })).toBe(CLUB_DISPLAY_NAME);
    expect(displayTeamName({ name: 'Uşak Spor', short_name: 'Uşak' })).toBe('Uşak Spor');
  });
});

describe('theme preference', () => {
  it('keeps system as a real preference and defaults unknown input to system', () => {
    expect(resolveAppTheme('system')).toBe('system');
    expect(resolveAppTheme(null)).toBe('system');
    expect(resolveAppTheme('dark')).toBe('dark');
    expect(resolveAppTheme('light')).toBe('light');
    expect(resolveAppTheme('garbage')).toBe('system');
    expect(buildOwnProfileUpdate({ display_name: 'Taraftar 16', theme_preference: 'system' }).theme_preference).toBe(
      'system',
    );
  });
});
