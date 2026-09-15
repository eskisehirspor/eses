export function getAdminPublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (supabaseAnonKey.toLowerCase().includes('service_role')) {
    throw new Error('Service-role anahtarı admin public ortamında kullanılamaz.');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  };
}
