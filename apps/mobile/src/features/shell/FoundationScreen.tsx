import { Screen, EmptyState, ErrorState, OfflineState, ScreenSkeleton } from '@/design';
import { resolveAsyncStatus, type AsyncStatus } from '@/lib/session-state';

export function FoundationScreen({
  status,
  emptyTitle,
  emptyDescription,
  errorDescription,
  onRetry,
}: {
  status: AsyncStatus;
  emptyTitle: string;
  emptyDescription: string;
  errorDescription: string;
  onRetry?: () => void;
}) {
  return (
    <Screen>
      {status === 'offline' ? <OfflineState onRetry={onRetry} /> : null}
      {status === 'loading' ? <ScreenSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={errorDescription} onRetry={onRetry} />
      ) : null}
      {status === 'empty' || status === 'ready' ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : null}
    </Screen>
  );
}

export function useFoundationStatus(input: {
  isLoading: boolean;
  isOffline: boolean;
  errorMessage: string | null;
}): AsyncStatus {
  return resolveAsyncStatus({
    isLoading: input.isLoading,
    isOffline: input.isOffline,
    errorMessage: input.errorMessage,
    isEmpty: true,
  });
}
