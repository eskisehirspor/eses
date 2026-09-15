import { FoundationScreen, useFoundationStatus } from '@/features/shell/FoundationScreen';
import { useAuth } from '@/lib/auth-context';
import { useNetwork } from '@/lib/network-context';

export default function HomeScreen() {
  const { isReady, errorMessage, isConfigured } = useAuth();
  const { isOffline, refresh } = useNetwork();
  const status = useFoundationStatus({
    isLoading: !isReady,
    isOffline,
    errorMessage: isConfigured ? null : errorMessage,
  });

  return (
    <FoundationScreen
      status={status}
      emptyTitle="Dijital tribün temeli"
      emptyDescription="Phase 0 altyapısı. Haber, maç ve XP içerikleri sonraki fazlarda gelecek. Sahte skor yok."
      errorDescription={errorMessage ?? 'Yapılandırma eksik.'}
      onRetry={() => void refresh()}
    />
  );
}
