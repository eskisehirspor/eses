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
