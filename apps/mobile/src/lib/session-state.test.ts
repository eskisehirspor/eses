import { describe, expect, it } from 'vitest';
import { getPublicEnv } from './env';
import { canUseProtectedAction, requiresAuth, resolveAsyncStatus } from './session-state';

describe('auth guard helpers', () => {
  it('keeps signed-out users on public tabs conceptually', () => {
    expect(requiresAuth(false)).toBe('signed-out');
    expect(requiresAuth(true)).toBe('signed-in');
    expect(canUseProtectedAction(false, false)).toBe(false);
    expect(canUseProtectedAction(true, true)).toBe(false);
    expect(canUseProtectedAction(true, false)).toBe(true);
  });
});

describe('async screen status', () => {
  it('prioritizes offline then loading then error then empty', () => {
    expect(
      resolveAsyncStatus({
        isLoading: true,
        isOffline: true,
        errorMessage: 'x',
        isEmpty: true,
      }),
    ).toBe('offline');
    expect(
      resolveAsyncStatus({
        isLoading: true,
        isOffline: false,
        errorMessage: null,
        isEmpty: true,
      }),
    ).toBe('loading');
    expect(
      resolveAsyncStatus({
        isLoading: false,
        isOffline: false,
        errorMessage: 'fail',
        isEmpty: true,
      }),
    ).toBe('error');
    expect(
      resolveAsyncStatus({
        isLoading: false,
        isOffline: false,
        errorMessage: null,
        isEmpty: true,
      }),
    ).toBe('empty');
  });
});

describe('env', () => {
  it('rejects service-role keys in public env', () => {
    const previousKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJ.service_role.fake';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    expect(() => getPublicEnv()).toThrow(/Service-role/);
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  });
});
