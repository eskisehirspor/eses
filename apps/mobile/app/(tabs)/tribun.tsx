import { FoundationScreen, useFoundationStatus } from '@/features/shell/FoundationScreen';
import { useNetwork } from '@/lib/network-context';

export default function TribunScreen() {
  const { isOffline, refresh } = useNetwork();
  const status = useFoundationStatus({
    isLoading: false,
    isOffline,
    errorMessage: null,
  });

  return (
    <FoundationScreen
      status={status}
      emptyTitle="Tribün yakında"
      emptyDescription="Forum ve maç sohbeti V1’de. Şu an sahte gönderi yok."
      errorDescription="Tribün yüklenemedi."
      onRetry={() => void refresh()}
    />
  );
}
