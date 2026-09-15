import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  normalizeThemePreference,
  type AppThemeMode,
} from '@eskisehirspor/shared';
import { darkColors, lightColors, type ThemeColors } from './theme-palettes';
import { useAuth } from '@/lib/auth-context';
import { getSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

type ThemeContextValue = {
  mode: AppThemeMode;
  colors: ThemeColors;
  setMode: (mode: AppThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [mode, setModeState] = useState<AppThemeMode>('dark');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!session?.user.id) {
        if (!cancelled) {
          setModeState('dark');
        }
        return;
      }
      const client = getSupabaseClient();
      if (!client) {
        return;
      }
      const { data, error } = await client
        .from('profiles')
        .select('theme_preference')
        .eq('id', session.user.id)
        .maybeSingle();
      if (error) {
        logger.error('Tema okunamadı', { code: 'theme.read', cause: error.message });
        return;
      }
      if (!cancelled) {
        setModeState(normalizeThemePreference(data?.theme_preference));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: mode === 'light' ? lightColors : darkColors,
      setMode: setModeState,
    }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={mode === 'light' ? 'dark' : 'light'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme ThemeProvider dışında kullanıldı.');
  }
  return ctx;
}

export function useColors(): ThemeColors {
  return useTheme().colors;
}
