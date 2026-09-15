import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { RoleSchema, type Role } from '@eskisehirspor/shared';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dialog,
  Divider,
  EmptyState,
  ErrorState,
  OfflineState,
  Screen,
  ScreenSkeleton,
  Text,
  useToast,
} from '@/design';
import { useAuth } from '@/lib/auth-context';
import { useNetwork } from '@/lib/network-context';
import { getSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

type ProfileRow = {
  display_name: string;
  preferred_locale: string;
  theme_preference: string;
};

export function ProfileScreen() {
  const { session, isReady, isConfigured, errorMessage } = useAuth();
  const { isOffline, refresh } = useNetwork();
  const toast = useToast();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['profile', session?.user.id],
    enabled: Boolean(session?.user.id) && isConfigured,
    queryFn: async (): Promise<{ profile: ProfileRow; roles: Role[] }> => {
      const supabase = getSupabaseClient();
      if (!supabase || !session?.user.id) {
        throw new Error('missing_client');
      }
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, preferred_locale, theme_preference')
        .eq('id', session.user.id)
        .maybeSingle();
      if (profileError) {
        logger.error('Profil okunamadı', { code: 'profile.read', cause: profileError.message });
        throw profileError;
      }
      const { data: roleRows, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);
      if (roleError) {
        logger.error('Roller okunamadı', { code: 'roles.read', cause: roleError.message });
        throw roleError;
      }
      const roles = (roleRows ?? [])
        .map((row) => RoleSchema.safeParse(row.role))
        .filter((result) => result.success)
        .map((result) => result.data);
      if (!profile) {
        throw new Error('profile_missing');
      }
      return { profile, roles };
    },
  });

  if (!isReady) {
    return (
      <Screen>
        <ScreenSkeleton />
      </Screen>
    );
  }

  if (!isConfigured) {
    return (
      <Screen>
        <ErrorState description={errorMessage ?? 'Supabase yapılandırması eksik.'} />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        {isOffline ? <OfflineState onRetry={() => void refresh()} /> : null}
        <EmptyState
          title="Hesabın"
          description="Profil, oturum ve çıkış burada. İçerik sekmeleri giriş olmadan da açılır."
          actionLabel="Giriş yap"
          onAction={() => router.push('/(auth)/sign-in')}
        />
      </Screen>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <Screen>
        <ScreenSkeleton />
      </Screen>
    );
  }

  if (profileQuery.isError) {
    return (
      <Screen>
        <ErrorState
          description="Profil bilgileri alınamadı."
          onRetry={() => void profileQuery.refetch()}
        />
      </Screen>
    );
  }

  const profile = profileQuery.data?.profile;
  const roles = profileQuery.data?.roles ?? [];

  async function signOut() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Çıkış başarısız', { code: 'auth.sign_out', cause: error.message });
        toast.show('Çıkış yapılamadı.', 'danger');
        return;
      }
      setSignOutOpen(false);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Screen scroll>
      {isOffline ? <OfflineState onRetry={() => void refresh()} /> : null}
      <Text variant="title">Profil</Text>
      <Card>
        <Avatar name={profile?.display_name ?? 'Taraftar'} />
        <Text variant="subtitle">{profile?.display_name ?? 'Taraftar'}</Text>
        <Text muted>{session.user.email}</Text>
        <Divider />
        <Text variant="caption">Dil: {profile?.preferred_locale ?? 'tr'}</Text>
        <Text variant="caption">Tema tercihi: {profile?.theme_preference ?? 'system'} (yer tutucu)</Text>
        <Text variant="caption">Hesap: aktif</Text>
        <Divider />
        <Text variant="caption">Roller (salt okunur)</Text>
        {roles.map((role) => (
          <Badge key={role} label={role} />
        ))}
        <Button
          label="Çıkış yap"
          variant="danger"
          loading={signingOut}
          onPress={() => setSignOutOpen(true)}
        />
      </Card>
      <Dialog
        visible={signOutOpen}
        title="Çıkış"
        description="Oturumun kapatılacak."
        confirmLabel="Çıkış yap"
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => void signOut()}
      />
    </Screen>
  );
}
