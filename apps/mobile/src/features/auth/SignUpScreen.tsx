import { Link, router } from 'expo-router';
import { useState } from 'react';
import { DisplayNameSchema, SignUpSchema } from '@eskisehirspor/shared';
import { Button, Card, ErrorState, Input, OfflineState, Screen, Text, useToast } from '@/design';
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
    if (displayName) {
      const name = DisplayNameSchema.safeParse(displayName);
      if (!name.success) {
        setFormError(name.error.issues[0]?.message ?? 'Görünen ad geçersiz.');
        return;
      }
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
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) {
        logger.error('Kayıt başarısız', { code: error.code ?? 'auth.sign_up', cause: error.message });
        setFormError(mapAuthError(error));
        return;
      }
      if (displayName) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '');
        if (profileError) {
          logger.error('Profil adı güncellenemedi', {
            code: 'profile.update',
            cause: profileError.message,
          });
          toast.show('Hesap oluştu; görünen ad sonra güncellenebilir.', 'danger');
        }
      }
      toast.show('Kayıt alındı. E-posta onayı açıksa kutunu kontrol et.');
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
