import { logger } from '@/lib/logger';

export function toAdminErrorMessage(error: { code?: string; message: string } | null): string {
  if (!error) {
    return 'İşlem tamamlanamadı.';
  }
  if (error.code === '23505') {
    return 'Bu slug zaten kullanılıyor.';
  }
  if (error.code === '42501' || error.message.includes('live_forbidden')) {
    return 'Bu işlem için yetkin yok.';
  }
  if (error.message.includes('match_already_started')) {
    return 'Maç zaten başladı.';
  }
  if (error.message.includes('match_not_scheduled')) {
    return 'Yalnızca planlı maç hazırlanır / başlatılır.';
  }
  if (error.message.includes('match_not_live')) {
    return 'Maç canlı değil.';
  }
  if (error.message.includes('team_not_in_fixture')) {
    return 'Takım bu maçta yok.';
  }
  if (error.message.includes('player_not_on_team')) {
    return 'Oyuncu bu takımda değil.';
  }
  if (error.message.includes('live_fields_protected')) {
    return 'Skor ve durum yalnızca canlı işlemlerle değişir.';
  }
  logger.error('Admin veri hatası', { code: error.code ?? 'db', cause: error.message });
  return 'İşlem tamamlanamadı.';
}
