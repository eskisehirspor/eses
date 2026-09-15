import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAdminPublicEnv } from '../env';

export async function createSupabaseServerClient() {
  const env = getAdminPublicEnv();
  if (!env.isConfigured) {
    throw new Error('Supabase public env missing');
  }

  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          console.info('Supabase cookie yazımı Server Component içinde atlandı', {
            code: 'supabase.cookie_set',
            cause: error instanceof Error ? error.message : 'unknown',
          });
        }
      },
    },
  });
}
