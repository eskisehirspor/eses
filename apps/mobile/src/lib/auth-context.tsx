import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getPublicEnv } from '@/lib/env';
import { getSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

type AuthContextValue = {
  session: Session | null;
  isReady: boolean;
  isConfigured: boolean;
  errorMessage: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const env = getPublicEnv();
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(!env.isConfigured);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    env.isConfigured ? null : 'Supabase ortam değişkenleri tanımlı değil.',
  );

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) {
          return;
        }
        if (error) {
          logger.error('Session okunamadı', { code: 'auth.session_read', cause: error.message });
          setErrorMessage('Oturum okunamadı.');
        } else {
          setSession(data.session);
        }
      })
      .catch((error: unknown) => {
        logger.error('Session okuma hatası', {
          code: 'auth.session_read',
          cause: error instanceof Error ? error.message : 'unknown',
        });
        if (active) {
          setErrorMessage('Oturum okunamadı.');
        }
      })
      .finally(() => {
        if (active) {
          setIsReady(true);
        }
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      isReady,
      isConfigured: env.isConfigured,
      errorMessage,
    }),
    [session, isReady, env.isConfigured, errorMessage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth AuthProvider dışında kullanılamaz.');
  }
  return ctx;
}
