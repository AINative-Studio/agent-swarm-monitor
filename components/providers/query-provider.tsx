'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { shouldRetryQuery } from '@/lib/api-client';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            // Don't retry auth failures (401/403) -- retrying can't succeed,
            // and without this a failed list query stays in isLoading
            // through 3 default retries (with backoff) before isError
            // finally becomes true. See issue #109.
            retry: shouldRetryQuery,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
