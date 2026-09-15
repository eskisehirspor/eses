export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message === 'not_configured') {
    return 'Supabase yapılandırması eksik.';
  }
  return fallback;
}
