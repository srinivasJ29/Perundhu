import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query Client with sensible caching and error propagation defaults.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes data freshness for catalog resources
      gcTime: 1000 * 60 * 10,   // 10 minutes cache retention
      retry: (failureCount, error: any) => {
        // Do not retry on 401, 403, or 404
        if (error?.statusCode === 401 || error?.statusCode === 403 || error?.statusCode === 404) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // Prevent aggressive re-fetching on tab switch
      refetchOnReconnect: true
    },
    mutations: {
      retry: false // Non-idempotent mutations must never automatically retry
    }
  }
});
