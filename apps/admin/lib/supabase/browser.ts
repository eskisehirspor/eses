import { createBrowserClient } from '@supabase/ssr';
import { getAdminPublicEnv } from '../env';

export function createSupabaseBrowserClient() {
  const env = getAdminPublicEnv();
  if (!env.isConfigured) {
    throw new Error('Supabase public env missing');
  }
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
