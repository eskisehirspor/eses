'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function signInAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    logger.error('Admin giriş başarısız', { code: error.code ?? 'auth.sign_in', cause: error.message });
    redirect(`/login?error=1`);
  }
  redirect('/console');
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    logger.error('Admin çıkış başarısız', { code: 'auth.sign_out', cause: error.message });
  }
  redirect('/login');
}
