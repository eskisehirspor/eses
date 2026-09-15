export type HomeSurfaceState = 'loading' | 'empty' | 'error' | 'ready';

export function resolveHomeState(input: {
  isLoading: boolean;
  errorMessage: string | null;
  hasNextMatch: boolean;
  hasNews: boolean;
  hasRecentResult: boolean;
}): HomeSurfaceState {
  if (input.isLoading) {
    return 'loading';
  }
  if (input.errorMessage) {
    return 'error';
  }
  if (!input.hasNextMatch && !input.hasNews && !input.hasRecentResult) {
    return 'empty';
  }
  return 'ready';
}
