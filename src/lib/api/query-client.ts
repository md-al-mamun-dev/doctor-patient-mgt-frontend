import { isServer, QueryClient } from '@tanstack/react-query';
import { isApiError } from './errors';

const MAX_RETRIES = 2;

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        // Retry only what can succeed on a second try: offline, timeouts, 5xx, 429.
        // 4xx answers (bad input, no permission, not found) will fail the same way again.
        retry: (failureCount, error) =>
          failureCount < MAX_RETRIES && (isApiError(error) ? error.retryable : true),
        retryDelay: (attempt, error) => {
          if (isApiError(error) && error.retryAfterSeconds !== undefined) {
            return Math.min(error.retryAfterSeconds * 1000, 30_000);
          }
          return Math.min(1000 * 2 ** attempt, 8_000);
        },
      },
      // Writes are never retried automatically: a retried create could save twice.
      mutations: { retry: false },
    },
  });
}

let browserClient: QueryClient | undefined;

/** One client per browser tab; a fresh one per request on the server. */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserClient ??= makeQueryClient();
  return browserClient;
}
