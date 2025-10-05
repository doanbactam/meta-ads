'use client';

import type { QueryClient } from '@tanstack/react-query';

class BackgroundSyncService {
  private queryClient: QueryClient | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private isActive = false;

  init(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  start(adAccountId: string) {
    if (this.isActive || !this.queryClient) return;

    this.isActive = true;

    // Sync data mỗi 10 phút khi tab active
    this.syncInterval = setInterval(
      () => {
        if (document.visibilityState === 'visible') {
          this.syncCriticalData(adAccountId);
        }
      },
      10 * 60 * 1000
    ); // 10 minutes

    // Sync ngay khi start
    this.syncCriticalData(adAccountId);
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isActive = false;
  }

  private async syncCriticalData(adAccountId: string) {
    if (!this.queryClient) return;

    try {
      // Chỉ sync data quan trọng và thay đổi thường xuyên
      await Promise.allSettled([
        // Overview stats - thay đổi thường xuyên
        this.queryClient.refetchQueries({
          queryKey: ['overview-stats', adAccountId],
          type: 'active',
        }),

        // Campaign performance - cần update thường xuyên
        this.queryClient.refetchQueries({
          queryKey: ['campaigns', adAccountId],
          type: 'active',
        }),
      ]);
    } catch (error) {
      console.warn('Background sync failed:', error);
    }
  }

  // Prefetch data khi user hover vào navigation
  async prefetchPageData(page: string, adAccountId: string) {
    if (!this.queryClient || !adAccountId) return;

    try {
      switch (page) {
        case 'campaigns':
          await this.queryClient.prefetchQuery({
            queryKey: ['campaigns', adAccountId],
            queryFn: async () => {
              const response = await fetch(`/api/campaigns?adAccountId=${adAccountId}`);
              if (!response.ok) throw new Error('Failed to prefetch campaigns');
              const data = await response.json();
              return data.campaigns || [];
            },
            staleTime: 5 * 60 * 1000,
          });
          break;

        case 'ad-sets':
          await this.queryClient.prefetchQuery({
            queryKey: ['ad-sets', adAccountId],
            queryFn: async () => {
              const response = await fetch(`/api/ad-sets?adAccountId=${adAccountId}`);
              if (!response.ok) throw new Error('Failed to prefetch ad sets');
              return response.json();
            },
            staleTime: 5 * 60 * 1000,
          });
          break;
      }
    } catch (error) {
      console.warn(`Failed to prefetch ${page} data:`, error);
    }
  }
}

export const backgroundSync = new BackgroundSyncService();
