import { Link } from 'expo-router';
import { useState } from 'react';
import { SignInSchema, isSocialAuthConfigured } from '@eskisehirspor/shared';
import { Button, Card, Screen, Text, Input, useToast, ErrorState, OfflineState } from '@/design';
import { getPublicEnv } from '@/lib/env';
import { getSupabaseClient } from '@/lib/supabase';
import { mapAuthError } from '@/lib/auth-errors';
import { logger } from '@/lib/logger';
import { useNetwork } from '@/lib/network-context';

export function SignInScreen() {
  const env = getPublicEnv();
  const { isOffline } = useNetwork();
  const toast = useToast();
  const social = isSocialAuthConfigured({
    appleEnabled: env.appleEnabled,
    googleEnabled: env.googleEnabled,
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit() {
    setFormError(null);
    const parsed = SignInSchema.safeParse({ email, password });
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
      setFormError('Giriş için internet gerekli.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) {
        logger.error('Giriş başarısız', { code: error.code ?? 'auth.sign_in', cause: error.message });
        setFormError(mapAuthError(error));
        return;
      }
      toast.show('Giriş başarılı.');
    } catch (error) {
      logger.error('Giriş istisnası', {
        code: 'auth.sign_in',
        cause: error instanceof Error ? error.message : 'unknown',
      });
      setFormError('Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  }

  if (!env.isConfigured) {
    return (
      <Screen>
        <ErrorState description="Supabase URL ve anon anahtarı tanımlı değil. apps/mobile/.env dosyasını kontrol et." />
      </Screen>
    );
  }

  return (
    <Screen scroll keyboard>
      {isOffline ? <OfflineState /> : null}
      <Text variant="title">Giriş</Text>
      <Text muted>E-posta ve şifre ile devam et. Apple ve Google, sağlayıcı kurulumu bitmeden açılmaz.</Text>
      <Card>
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
          autoComplete="password"
        />
        {formError ? <Text tone="danger">{formError}</Text> : null}
        <Button label="Giriş yap" loading={loading} onPress={() => void onSubmit()} />
        <Button
          label="Apple ile gir"
          variant="secondary"
          disabled={!social.apple}
          onPress={() => toast.show('Apple girişi henüz yapılandırılmadı.', 'danger')}
        />
        <Button
          label="Google ile gir"
          variant="secondary"
          disabled={!social.google}
          onPress={() => toast.show('Google girişi henüz yapılandırılmadı.', 'danger')}
        />
        <Text variant="caption" muted>
          Sosyal giriş için Supabase Auth sağlayıcıları ve native istemci kimlikleri gerekir. Eksik akış
          çağrılmaz.
        </Text>
      </Card>
      <Link href="/(auth)/sign-up">
        <Text>Hesabın yok mu? Kayıt ol</Text>
      </Link>
    </Screen>
  );
}
