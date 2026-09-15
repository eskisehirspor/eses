import { z } from 'zod';

export const PROFILE_CLIENT_WRITABLE_FIELDS = [
  'display_name',
  'avatar_path',
  'preferred_locale',
  'theme_preference',
] as const;

export type ProfileClientWritableField = (typeof PROFILE_CLIENT_WRITABLE_FIELDS)[number];

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(3, 'Görünen ad en az 3 karakter olmalı.')
  .max(24, 'Görünen ad en fazla 24 karakter olabilir.')
  .regex(/^[A-Za-z0-9ÇĞİÖŞÜçğıöşü ._'-]+$/, 'Görünen ad geçersiz karakter içeriyor.');

export const ThemePreferenceSchema = z.enum(['system', 'light', 'dark']);
export const LocaleSchema = z.enum(['tr']);

export const ProfileUpdateSchema = z
  .object({
    display_name: DisplayNameSchema.optional(),
    avatar_path: z.string().min(1).max(512).nullable().optional(),
    preferred_locale: LocaleSchema.optional(),
    theme_preference: ThemePreferenceSchema.optional(),
  })
  .strict();

export type ThemePreference = z.infer<typeof ThemePreferenceSchema>;

export type AppThemeMode = 'dark' | 'light';

/** UI-facing theme choices. DB may still hold legacy `system`. */
export const THEME_UI_OPTIONS = [
  { value: 'dark', label: 'Koyu' },
  { value: 'light', label: 'Açık' },
] as const satisfies readonly { value: AppThemeMode; label: string }[];

export const THEME_PREFERENCE_OPTIONS = THEME_UI_OPTIONS;

export function resolveAppTheme(preference: string | null | undefined): AppThemeMode {
  return preference === 'light' ? 'light' : 'dark';
}

export function normalizeThemePreference(preference: string | null | undefined): AppThemeMode {
  return resolveAppTheme(preference);
}

export type OwnProfileUpdate = {
  display_name: string;
  theme_preference: AppThemeMode;
  preferred_locale: 'tr';
};

/** Whitelisted own-profile write. Never includes deleted_at, roles, or avatar_path. */
export function buildOwnProfileUpdate(input: {
  display_name: string;
  theme_preference: string;
}): OwnProfileUpdate {
  const parsed = ProfileUpdateSchema.safeParse({
    display_name: input.display_name,
    theme_preference: input.theme_preference,
    preferred_locale: 'tr',
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Profil bilgileri geçersiz.');
  }
  const display_name = parsed.data.display_name;
  const theme_preference = normalizeThemePreference(parsed.data.theme_preference);
  if (!display_name) {
    throw new Error('Görünen ad ve görünüm gerekli.');
  }
  return {
    display_name,
    theme_preference,
    preferred_locale: 'tr',
  };
}

export function buildSignupDisplayNamePatch(displayName: string): {
  display_name: string;
  preferred_locale: 'tr';
} {
  const parsed = ProfileUpdateSchema.safeParse({
    display_name: displayName,
    preferred_locale: 'tr',
  });
  if (!parsed.success || !parsed.data.display_name) {
    throw new Error(parsed.error?.issues[0]?.message ?? 'Görünen ad geçersiz.');
  }
  return {
    display_name: parsed.data.display_name,
    preferred_locale: 'tr',
  };
}

/** Matches `handle_new_user` default: Taraftar + first 8 hex chars of uuid without dashes. */
export function placeholderDisplayName(userId: string): string {
  return `Taraftar${userId.replace(/-/g, '').slice(0, 8)}`;
}

export function isPlaceholderDisplayName(userId: string, displayName: string): boolean {
  return displayName === placeholderDisplayName(userId);
}

export function displayNameFromUserMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }
  const parsed = DisplayNameSchema.safeParse(
    (metadata as Record<string, unknown>).display_name,
  );
  return parsed.success ? parsed.data : null;
}

export function pendingSignupDisplayName(input: {
  userId: string;
  currentDisplayName: string;
  metadata: unknown;
}): string | null {
  const fromMeta = displayNameFromUserMetadata(input.metadata);
  if (!fromMeta) {
    return null;
  }
  if (fromMeta === input.currentDisplayName) {
    return null;
  }
  if (!isPlaceholderDisplayName(input.userId, input.currentDisplayName)) {
    return null;
  }
  return fromMeta;
}

export const EmailSchema = z.string().trim().email('Geçerli bir e-posta gir.');
export const PasswordSchema = z.string().min(8, 'Şifre en az 8 karakter olmalı.');

export const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Şifre gerekli.'),
});

export const SignUpSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  display_name: DisplayNameSchema.optional(),
});
