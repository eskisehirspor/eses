import { getAdminPublicEnv } from '@/lib/env';
import { signInAction } from './actions';

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return <LoginInner searchParams={searchParams} />;
}

async function LoginInner({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const env = getAdminPublicEnv();
  const params = await searchParams;

  return (
    <main className="main">
      <div className="card">
        <h1>Yönetim girişi</h1>
        <p className="muted">
          Yetki, tarayıcıdaki rol iddiasına göre değil; oturum + user_roles satırına göre verilir.
        </p>
        {!env.isConfigured ? (
          <p className="error">NEXT_PUBLIC_SUPABASE_URL ve ANON key tanımlı değil.</p>
        ) : (
          <form action={signInAction}>
            <label htmlFor="email">E-posta</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="password">Şifre</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
            {params.error ? <p className="error">Giriş başarısız.</p> : null}
            <button type="submit">Giriş yap</button>
          </form>
        )}
        <p className="muted">Apple/Google admin girişi Phase 0’da yok; native sağlayıcı kurulumu gerekir.</p>
      </div>
    </main>
  );
}
