import { describe, expect, it } from 'vitest';
import {
  buildOwnProfileUpdate,
  buildSignupDisplayNamePatch,
  pendingSignupDisplayName,
  ProfileUpdateSchema,
} from '@eskisehirspor/shared';

describe('own profile update contract', () => {
  it('never ships protected columns', () => {
    const payload = buildOwnProfileUpdate({
      display_name: 'Eskişehir 16',
      theme_preference: 'system',
    });
    expect(payload.theme_preference).toBe('system');
    expect(Object.keys(payload).sort()).toEqual(
      ['display_name', 'preferred_locale', 'theme_preference'].sort(),
    );
    expect(
      ProfileUpdateSchema.safeParse({ ...payload, deleted_at: new Date().toISOString() }).success,
    ).toBe(false);
    expect(ProfileUpdateSchema.safeParse({ ...payload, role: 'admin' }).success).toBe(false);
  });

  it('signup patch only writes display_name and locale', () => {
    const patch = buildSignupDisplayNamePatch('  Tribün  ');
    expect(patch).toEqual({ display_name: 'Tribün', preferred_locale: 'tr' });
  });

  it('does not treat a chosen name as the trigger placeholder', () => {
    expect(
      pendingSignupDisplayName({
        userId: '11111111-1111-4111-8111-111111111111',
        currentDisplayName: 'Kırmızı Şimşek',
        metadata: { display_name: 'Başka Ad' },
      }),
    ).toBeNull();
  });
});
