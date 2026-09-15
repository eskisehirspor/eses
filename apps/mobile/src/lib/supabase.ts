import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv } from './env';
import { authStorage } from './auth-storage';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const env = getPublicEnv();
  if (!env.isConfigured) {
    return null;
  }
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
