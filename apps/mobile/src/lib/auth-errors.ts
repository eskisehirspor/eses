export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-posta veya şifre hatalı.',
  email_not_confirmed: 'E-posta henüz doğrulanmadı.',
  user_already_exists: 'Bu e-posta ile kayıt zaten var.',
  over_request_rate_limit: 'Çok fazla deneme. Biraz sonra tekrar dene.',
};

export function mapAuthError(error: { message: string; code?: string } | null): string {
  if (!error) {
    return 'Kimlik doğrulama başarısız.';
  }
  if (error.code) {
    const mapped = AUTH_ERROR_MESSAGES[error.code];
    if (mapped) {
      return mapped;
    }
  }
  const lowered = error.message.toLowerCase();
  if (lowered.includes('invalid login')) {
    return AUTH_ERROR_MESSAGES.invalid_credentials ?? 'E-posta veya şifre hatalı.';
  }
  return 'Kimlik doğrulama başarısız. Ayrıntı günlükte.';
}
