'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { backgroundSync } from '@/lib/background-sync';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Tăng thời gian cache từ 1 phút lên 10 phút
            staleTime: 10 * 60 * 1000, // 10 minutes
            // Cache data trong 30 phút kể cả khi component unmount
            gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime)
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Không fetch lại khi mount nếu có cache
            refetchOnReconnect: false,
            // Retry ít hơn để tránh spam requests
            retry: 1,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  );

  // Initialize background sync
  useEffect(() => {
    backgroundSync.init(queryClient);
    
    return () => {
      backgroundSync.stop();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
