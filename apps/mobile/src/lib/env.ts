export function getPublicEnv() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const appleEnabled = process.env.EXPO_PUBLIC_AUTH_APPLE_ENABLED === 'true';
  const googleEnabled = process.env.EXPO_PUBLIC_AUTH_GOOGLE_ENABLED === 'true';

  if (supabaseAnonKey.toLowerCase().includes('service_role')) {
    throw new Error('Service-role anahtarı mobil istemcide kullanılamaz.');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    appleEnabled,
    googleEnabled,
    isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  };
}
