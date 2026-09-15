import { FoundationScreen, useFoundationStatus } from '@/features/shell/FoundationScreen';
import { useNetwork } from '@/lib/network-context';

export default function MatchesScreen() {
  const { isOffline, refresh } = useNetwork();
  const status = useFoundationStatus({
    isLoading: false,
    isOffline,
    errorMessage: null,
  });

  return (
    <FoundationScreen
      status={status}
      emptyTitle="Maç merkezi yakında"
      emptyDescription="Fikstür, puan durumu ve canlı skor Phase 1+ ile gelecek."
      errorDescription="Maç merkezi yüklenemedi."
      onRetry={() => void refresh()}
    />
  );
}
