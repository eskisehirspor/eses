import { FoundationScreen, useFoundationStatus } from '@/features/shell/FoundationScreen';
import { useNetwork } from '@/lib/network-context';

export default function PlayScreen() {
  const { isOffline, refresh } = useNetwork();
  const status = useFoundationStatus({
    isLoading: false,
    isOffline,
    errorMessage: null,
  });

  return (
    <FoundationScreen
      status={status}
      emptyTitle="Oyunlar yakında"
      emptyDescription="Görev, tahmin, quiz ve XP defteri henüz yok. İstemci XP yazamaz."
      errorDescription="Oyna yüklenemedi."
      onRetry={() => void refresh()}
    />
  );
}
