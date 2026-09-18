import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
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
  /** Raw stored preference (`system` | `light` | `dark`) — what pickers should show as selected. */
  mode: AppThemeMode;
  /** Preference resolved through the device appearance when `mode` is `system`. */
  resolvedMode: 'light' | 'dark';
  colors: ThemeColors;
  setMode: (mode: AppThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<AppThemeMode>('system');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!session?.user.id) {
        if (!cancelled) {
          setModeState('system');
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

  const resolvedMode: 'light' | 'dark' = mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      colors: resolvedMode === 'light' ? lightColors : darkColors,
      setMode: setModeState,
    }),
    [mode, resolvedMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={resolvedMode === 'light' ? 'dark' : 'light'} />
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
