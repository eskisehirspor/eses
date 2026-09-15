import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { RoleSchema, type Role } from '@eskisehirspor/shared';
import {
  Button,
  ClubIdentity,
  Dialog,
  ErrorState,
  FutureSlot,
  IdentityCard,
  OfflineState,
  Screen,
  ScreenSkeleton,
  SectionHeader,
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
      <Screen scroll>
        {isOffline ? <OfflineState onRetry={() => void refresh()} /> : null}
        <ClubIdentity title="Taraftar kimliği" subtitle="ES ES hesabın" kicker="Giriş" />
        <Text muted>{errorMessage ?? 'Supabase yapılandırması eksik.'}</Text>
        <IdentityCard />
        <SectionHeader title="Hazırlanan katman" quiet />
        <FutureSlot kicker="Seviye" title="Taraftar kademesi" detail="Sunucu defteri olmadan gösterilmez." />
        <FutureSlot kicker="XP" title="Puan özeti" detail="İstemci yazamaz." />
        <FutureSlot kicker="Rozet" title="Koleksiyon" detail="Sahte rozet yok." />
        <FutureSlot kicker="Stadyum" title="Maçta varlık" detail="Geofence sonraki faz." />
        <FutureSlot kicker="Geçmiş" title="Maç geçmişi" detail="Resmi kayıt bağlanınca listelenir." />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen scroll>
        {isOffline ? <OfflineState onRetry={() => void refresh()} /> : null}
        <ClubIdentity title="Taraftar kimliği" subtitle="ES ES hesabın" kicker="Giriş" />
        <Text muted>
          Haber ve maç herkese açık. Kimlik, kart ve tribün geçmişi oturuma bağlıdır.
        </Text>
        <IdentityCard />
        <Button label="Giriş yap" onPress={() => router.push('/(auth)/sign-in')} />
        <Button label="Hesap oluştur" variant="secondary" onPress={() => router.push('/(auth)/sign-up')} />
        <SectionHeader title="Hazırlanan katman" quiet />
        <FutureSlot kicker="Seviye" title="Taraftar kademesi" detail="Sunucu defteri olmadan gösterilmez." />
        <FutureSlot kicker="XP" title="Puan özeti" detail="İstemci yazamaz." />
        <FutureSlot kicker="Rozet" title="Koleksiyon" detail="Sahte rozet yok." />
        <FutureSlot kicker="Stadyum" title="Maçta varlık" detail="Geofence sonraki faz." />
        <FutureSlot kicker="Geçmiş" title="Maç geçmişi" detail="Resmi kayıt bağlanınca listelenir." />
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
        <ClubIdentity
          compact
          title={profile?.display_name ?? 'Taraftar'}
          subtitle={session.user.email ?? ''}
          kicker="Taraftar"
        />
      <IdentityCard />
      <SectionHeader title="Kimlik katmanı" quiet />
      <FutureSlot kicker="Seviye" title="Taraftar kademesi" detail="Henüz hesaplanmaz." />
      <FutureSlot kicker="XP" title="ES ES puanı" detail="Ledger yok." />
      <FutureSlot kicker="Rozet" title="Koleksiyon" detail="Boş tutulur." />
      <FutureSlot kicker="Stadyum" title="Varlık kayıtları" detail="Doğrulama yok." />
      <FutureSlot kicker="Geçmiş" title="Maç geçmişi" detail="Resmi kayıt bağlanınca listelenir." />
      <Button label="Çıkış yap" variant="danger" loading={signingOut} onPress={() => setSignOutOpen(true)} />
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
