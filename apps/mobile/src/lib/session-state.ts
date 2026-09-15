export type AsyncStatus = 'loading' | 'empty' | 'error' | 'offline' | 'ready';

export function resolveAsyncStatus(input: {
  isLoading: boolean;
  isOffline: boolean;
  errorMessage: string | null;
  isEmpty: boolean;
}): AsyncStatus {
  if (input.isOffline) {
    return 'offline';
  }
  if (input.isLoading) {
    return 'loading';
  }
  if (input.errorMessage) {
    return 'error';
  }
  if (input.isEmpty) {
    return 'empty';
  }
  return 'ready';
}

export function canUseProtectedAction(isAuthenticated: boolean, isOffline: boolean): boolean {
  return isAuthenticated && !isOffline;
}

export function requiresAuth(isAuthenticated: boolean): 'signed-in' | 'signed-out' {
  return isAuthenticated ? 'signed-in' : 'signed-out';
}
