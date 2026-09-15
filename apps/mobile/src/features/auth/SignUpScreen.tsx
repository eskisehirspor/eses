import { Link, router } from 'expo-router';
import { useState } from 'react';
import { SignUpSchema } from '@eskisehirspor/shared';
import { applySignupDisplayName } from '@/features/profile/api';
import { Button, Card, ClubCrest, ErrorState, Input, OfflineState, Screen, Text, useToast } from '@/design';
import { getPublicEnv } from '@/lib/env';
import { getSupabaseClient } from '@/lib/supabase';
import { mapAuthError } from '@/lib/auth-errors';
import { logger } from '@/lib/logger';
import { useNetwork } from '@/lib/network-context';

export function SignUpScreen() {
  const env = getPublicEnv();
  const { isOffline } = useNetwork();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit() {
    setFormError(null);
    const parsed = SignUpSchema.safeParse({
      email,
      password,
      display_name: displayName || undefined,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Formu kontrol et.');
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setFormError('Supabase yapılandırması eksik.');
      return;
    }
    if (isOffline) {
      setFormError('Kayıt için internet gerekli.');
      return;
    }
    setLoading(true);
    try {
      const chosenName = parsed.data.display_name;
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: chosenName ? { data: { display_name: chosenName } } : undefined,
      });
      if (error) {
        logger.error('Kayıt başarısız', { code: error.code ?? 'auth.sign_up', cause: error.message });
        setFormError(mapAuthError(error));
        return;
      }
      if (chosenName && data.session?.user) {
        try {
          await applySignupDisplayName({
            userId: data.session.user.id,
            metadata: data.session.user.user_metadata,
          });
        } catch (profileError) {
          logger.error('Profil adı güncellenemedi', {
            code: 'profile.update',
            cause: profileError instanceof Error ? profileError.message : 'unknown',
          });
          toast.show('Hesap oluştu; görünen ad ilk girişte tamamlanır.', 'danger');
        }
      }
      toast.show(
        data.session
          ? 'Hesabın hazır. Kimliğin tribünde seni bekler.'
          : 'Kayıt alındı. E-posta onayı açıksa kutunu kontrol et; görünen ad ilk girişte yazılır.',
      );
      router.replace('/(auth)/sign-in');
    } catch (error) {
      logger.error('Kayıt istisnası', {
        code: 'auth.sign_up',
        cause: error instanceof Error ? error.message : 'unknown',
      });
      setFormError('Kayıt başarısız.');
    } finally {
      setLoading(false);
    }
  }

  if (!env.isConfigured) {
    return (
      <Screen>
        <ErrorState description="Supabase URL ve anon anahtarı tanımlı değil." />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboard>
      {isOffline ? <OfflineState /> : null}
      <ClubCrest size="lg" />
      <Text variant="title">Kayıt</Text>
      <Text muted>Varsayılan rol sunucu tarafında user olarak atanır. Rolü uygulamadan yükseltemezsin.</Text>
      <Card>
        <Input label="Görünen ad (isteğe bağlı)" value={displayName} onChangeText={setDisplayName} />
        <Input
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />
        <Input
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
        />
        {formError ? <Text tone="danger">{formError}</Text> : null}
        <Button label="Hesap oluştur" loading={loading} onPress={() => void onSubmit()} />
      </Card>
      <Link href="/(auth)/sign-in">
        <Text>Zaten hesabın var mı? Giriş yap</Text>
      </Link>
    </Screen>
  );
}
