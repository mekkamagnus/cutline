import { QueryClient } from '@tanstack/react-query';

/**
 * Global TanStack Query client configuration
 *
 * - staleTime: 5 minutes - data is fresh for 5 minutes
 * - gcTime: 30 minutes - unused data is garbage collected after 30 minutes
 * - retry: 3 times with exponential backoff for failed queries
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
