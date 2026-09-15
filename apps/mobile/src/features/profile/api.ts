import {
  buildOwnProfileUpdate,
  buildSignupDisplayNamePatch,
  normalizeThemePreference,
  pendingSignupDisplayName,
  type AppThemeMode,
} from '@eskisehirspor/shared';
import { getSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export type OwnProfile = {
  display_name: string;
  preferred_locale: string;
  theme_preference: AppThemeMode;
  avatar_path: string | null;
};

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('not_configured');
  }
  return client;
}

function mapProfileWriteError(error: { code?: string; message: string }): Error {
  if (error.code === '23505') {
    return new Error('Bu görünen ad kullanımda.');
  }
  return new Error(error.message);
}

function mapOwnProfile(data: {
  display_name: string;
  preferred_locale: string;
  theme_preference: string;
  avatar_path: string | null;
}): OwnProfile {
  return {
    display_name: data.display_name,
    preferred_locale: data.preferred_locale,
    theme_preference: normalizeThemePreference(data.theme_preference),
    avatar_path: data.avatar_path,
  };
}

export async function fetchOwnProfile(userId: string): Promise<OwnProfile> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, preferred_locale, theme_preference, avatar_path')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    logger.error('Profil okunamadı', { code: 'profile.read', cause: error.message });
    throw error;
  }
  if (!data) {
    throw new Error('profile_missing');
  }
  return mapOwnProfile(data);
}

export async function updateOwnProfile(
  userId: string,
  input: { display_name: string; theme_preference: string },
): Promise<OwnProfile> {
  const supabase = requireClient();
  const payload = buildOwnProfileUpdate(input);
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('display_name, preferred_locale, theme_preference, avatar_path')
    .maybeSingle();
  if (error) {
    logger.error('Profil güncellenemedi', { code: error.code ?? 'profile.update', cause: error.message });
    throw mapProfileWriteError(error);
  }
  if (!data) {
    throw new Error('profile_missing');
  }
  return mapOwnProfile(data);
}

export async function applySignupDisplayName(input: {
  userId: string;
  metadata: unknown;
}): Promise<boolean> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', input.userId)
    .maybeSingle();
  if (error) {
    logger.error('Profil adı senkronu okunamadı', { code: 'profile.sync_read', cause: error.message });
    throw error;
  }
  if (!data) {
    return false;
  }
  const next = pendingSignupDisplayName({
    userId: input.userId,
    currentDisplayName: data.display_name,
    metadata: input.metadata,
  });
  if (!next) {
    return false;
  }
  const payload = buildSignupDisplayNamePatch(next);
  const { error: updateError } = await supabase.from('profiles').update(payload).eq('id', input.userId);
  if (updateError) {
    logger.error('Kayıt adı uygulanamadı', {
      code: updateError.code ?? 'profile.sync_write',
      cause: updateError.message,
    });
    throw mapProfileWriteError(updateError);
  }
  return true;
}
