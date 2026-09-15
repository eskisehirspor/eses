export const AUTH_PROVIDERS = ['email', 'apple', 'google'] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

/**
 * Social providers are architected but not enabled until dashboard + native
 * credentials exist. Do not call incomplete OAuth from the client.
 */
export const SOCIAL_AUTH_SETUP = {
  apple: {
    supabase: 'Enable Apple provider in Supabase Auth with Services ID and secret.',
    ios: 'Apple Developer capability Sign in with Apple; Expo plugin expo-apple-authentication.',
    android: 'Not used as a primary path; Apple is iOS-first.',
  },
  google: {
    supabase: 'Enable Google provider with Web client ID and secret.',
    ios: 'iOS URL scheme + Google iOS client ID.',
    android: 'SHA-1 fingerprint + Android client ID.',
  },
} as const;

export function isSocialAuthConfigured(flags: {
  appleEnabled: boolean;
  googleEnabled: boolean;
}): { apple: boolean; google: boolean } {
  return {
    apple: flags.appleEnabled,
    google: flags.googleEnabled,
  };
}
