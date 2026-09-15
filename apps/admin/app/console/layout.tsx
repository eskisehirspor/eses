import type { ReactNode } from 'react';
import { RoleSchema, resolveAdminAccess, type Role } from '@eskisehirspor/shared';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { signOutAction } from '../login/actions';
import { logger } from '@/lib/logger';
import { getAdminPublicEnv } from '@/lib/env';

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const env = getAdminPublicEnv();
  if (!env.isConfigured) {
    redirect('/login');
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    logger.error('Admin oturum okunamadı', { code: 'auth.user', cause: userError.message });
    redirect('/login');
  }
  if (!user) {
    redirect('/login');
  }

  const { data: roleRows, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  if (roleError) {
    logger.error('Admin roller okunamadı', { code: 'roles.read', cause: roleError.message });
    redirect('/unauthorized');
  }

  const roles: Role[] = (roleRows ?? [])
    .map((row) => RoleSchema.safeParse(row.role))
    .filter((result) => result.success)
    .map((result) => result.data);

  const access = resolveAdminAccess({ hasSession: true, roles });
  if (access !== 'authorized') {
    redirect('/unauthorized');
  }

  return (
    <div className="shell">
      <aside className="nav">
        <strong>ES ES Admin</strong>
        <a href="/console">Özet</a>
        <p className="muted">Yayın, moderasyon ve XP araçları henüz yok.</p>
        <form action={signOutAction}>
          <button className="secondary" type="submit">
            Çıkış
          </button>
        </form>
      </aside>
      <div>{children}</div>
    </div>
  );
}
