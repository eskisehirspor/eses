import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { RoleSchema, type AppThemeMode, type Role } from '@eskisehirspor/shared';
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
import { applySignupDisplayName, fetchOwnProfile, updateOwnProfile } from './api';
import { ProfileEditor, profileSaveMessage } from './ProfileEditor';

export function ProfileScreen() {
  const { session, isReady, isConfigured, errorMessage } = useAuth();
  const { isOffline, refresh } = useNetwork();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const userId = session?.user.id;
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    enabled: Boolean(userId) && isConfigured,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      if (!supabase || !userId || !session) {
        throw new Error('missing_client');
      }
      try {
        await applySignupDisplayName({
          userId,
          metadata: session.user.user_metadata,
        });
      } catch (error) {
        logger.error('Kayıt adı senkronu atlandı', {
          code: 'profile.sync',
          cause: error instanceof Error ? error.message : 'unknown',
        });
      }
      const profile = await fetchOwnProfile(userId);
      const { data: roleRows, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      if (roleError) {
        logger.error('Roller okunamadı', { code: 'roles.read', cause: roleError.message });
        throw roleError;
      }
      const roles: Role[] = (roleRows ?? [])
        .map((row) => RoleSchema.safeParse(row.role))
        .filter((result) => result.success)
        .map((result) => result.data);
      return { profile, roles };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (input: { display_name: string; theme_preference: AppThemeMode }) => {
      if (!userId) {
        throw new Error('missing_client');
      }
      return updateOwnProfile(userId, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      setEditing(false);
      toast.show('Kimliğin güncellendi.');
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
        <ClubIdentity title="Taraftar kimliği" subtitle="Eskişehirspor hesabın" kicker="Giriş" />
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
        <ClubIdentity title="Taraftar kimliği" subtitle="Eskişehirspor hesabın" kicker="Giriş" />
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
      <IdentityCard supporterName={profile?.display_name} detail={session.user.email ?? undefined} />
      {profile && editing ? (
        <ProfileEditor
          key={`${profile.display_name}-${profile.theme_preference}`}
          profile={profile}
          saving={saveMutation.isPending}
          errorMessage={saveMutation.isError ? profileSaveMessage(saveMutation.error) : null}
          onSave={(input) => {
            if (isOffline) {
              toast.show('Kimliği kaydetmek için internet gerekli.', 'danger');
              return;
            }
            saveMutation.mutate(input);
          }}
        />
      ) : (
        <SectionHeader
          eyebrow="Kimlik"
          title="Tribündeki adın"
          actionLabel="Profili düzenle"
          onAction={() => {
            saveMutation.reset();
            setEditing(true);
          }}
        />
      )}
      {editing ? (
        <Button
          label="Vazgeç"
          variant="ghost"
          disabled={saveMutation.isPending}
          onPress={() => {
            saveMutation.reset();
            setEditing(false);
          }}
        />
      ) : null}
      <SectionHeader title="Kimlik katmanı" quiet />
      <FutureSlot kicker="Seviye" title="Taraftar kademesi" detail="Henüz hesaplanmaz." />
      <FutureSlot kicker="XP" title="Puan" detail="Ledger henüz açık değil." />
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
