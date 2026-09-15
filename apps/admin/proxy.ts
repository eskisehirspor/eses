import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { RoleSchema, resolveAdminAccess, type Role } from '@eskisehirspor/shared';
import { getAdminPublicEnv } from './lib/env';
import { updateSession } from './lib/supabase/middleware';
import { logger } from './lib/logger';

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;
  const isConsole = pathname.startsWith('/console') || pathname === '/';

  if (!isConsole && pathname !== '/unauthorized') {
    return response;
  }

  const env = getAdminPublicEnv();
  if (!env.isConfigured) {
    return response;
  }

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Session cookies already handled in updateSession.
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    logger.error('Proxy oturum doğrulanamadı', { code: 'auth.get_user', cause: error.message });
  }

  if (pathname === '/login') {
    return response;
  }

  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = user ? '/console' : '/login';
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/console')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    const { data: roleRows, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      logger.error('Proxy roller okunamadı', { code: 'roles.read', cause: roleError.message });
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }

    const roles: Role[] = (roleRows ?? [])
      .map((row) => RoleSchema.safeParse(row.role))
      .filter((result) => result.success)
      .map((result) => result.data);

    const access = resolveAdminAccess({ hasSession: true, roles });
    if (access !== 'authorized') {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
