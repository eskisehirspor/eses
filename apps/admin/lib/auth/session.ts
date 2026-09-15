import { cookies } from 'next/headers';
import { RoleSchema, type Role } from '@eskisehirspor/shared';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function getSessionRoles(): Promise<{ userId: string | null; roles: Role[] }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    logger.error('Oturum doğrulanamadı', { code: 'auth.get_user', cause: error.message });
    return { userId: null, roles: [] };
  }
  if (!user) {
    return { userId: null, roles: [] };
  }
  const { data, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);
  if (roleError) {
    logger.error('Roller okunamadı', { code: 'roles.read', cause: roleError.message });
    return { userId: user.id, roles: [] };
  }
  const roles = (data ?? [])
    .map((row) => RoleSchema.safeParse(row.role))
    .filter((result) => result.success)
    .map((result) => result.data);
  return { userId: user.id, roles };
}

/** Next cookies() marks the route dynamic; used to avoid static CMS shells. */
export async function markRequestDynamic() {
  await cookies();
}
