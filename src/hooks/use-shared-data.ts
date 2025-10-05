'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { dataPersistence } from '@/lib/client/data-persistence';

// Shared hook cho ad account data
export function useAdAccountData(adAccountId?: string) {
  return useQuery({
    queryKey: ['ad-account', adAccountId],
    queryFn: async () => {
      if (!adAccountId) return null;
      const response = await fetch(`/api/ad-accounts/${adAccountId}`);
      if (!response.ok) throw new Error('Failed to fetch ad account');
      return response.json();
    },
    enabled: !!adAccountId,
    staleTime: 15 * 60 * 1000, // 15 minutes - ad account info ít thay đổi
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// Shared hook cho campaigns với prefetch và persistence
export function useCampaignsData(adAccountId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['campaigns', adAccountId],
    queryFn: async () => {
      if (!adAccountId) return [];

      // Thử lấy từ localStorage trước
      const cacheKey = `campaigns_${adAccountId}`;
      const cached = dataPersistence.get(cacheKey);
      if (cached) {
        // Fetch mới trong background
        setTimeout(async () => {
          try {
            const response = await fetch(`/api/campaigns?adAccountId=${adAccountId}`);
            if (response.ok) {
              const data = await response.json();
              const campaigns = data.campaigns || [];
              dataPersistence.set(cacheKey, campaigns, 10); // Cache 10 phút
              queryClient.setQueryData(['campaigns', adAccountId], campaigns);
            }
          } catch (error) {
            console.warn('Background fetch failed:', error);
          }
        }, 100);

        return cached;
      }

      // Fetch mới nếu không có cache
      const response = await fetch(`/api/campaigns?adAccountId=${adAccountId}`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      const campaigns = data.campaigns || [];

      // Lưu vào localStorage
      dataPersistence.set(cacheKey, campaigns, 10);

      return campaigns;
    },
    enabled: !!adAccountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  });

  // Prefetch related data
  const prefetchAdSets = useCallback(
    async (campaignId: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['ad-sets', campaignId],
        queryFn: async () => {
          const response = await fetch(`/api/ad-sets?campaignId=${campaignId}`);
          if (!response.ok) throw new Error('Failed to fetch ad sets');
          return response.json();
        },
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );

  return { ...query, prefetchAdSets };
}

// Shared hook cho overview stats với background refetch
export function useOverviewStats(
  adAccountId?: string,
  dateRange?: { from: Date | undefined; to: Date | undefined }
) {
  return useQuery({
    queryKey: ['overview-stats', adAccountId, dateRange],
    queryFn: async () => {
      if (!adAccountId) return null;

      const params = new URLSearchParams();
      if (dateRange?.from) params.append('from', dateRange.from.toISOString());
      if (dateRange?.to) params.append('to', dateRange.to.toISOString());

      const response = await fetch(`/api/ad-accounts/${adAccountId}/overview?${params}`);
      if (!response.ok) throw new Error('Failed to fetch overview stats');
      return response.json();
    },
    enabled: !!adAccountId,
    staleTime: 3 * 60 * 1000, // 3 minutes - stats cần fresh hơn
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 5 * 60 * 1000, // Auto refresh mỗi 5 phút khi tab active
    refetchIntervalInBackground: false,
  });
}

// Hook để invalidate cache khi cần
export function useDataRefresh() {
  const queryClient = useQueryClient();

  const refreshAdAccount = useCallback(
    (adAccountId: string) => {
      queryClient.invalidateQueries({ queryKey: ['ad-account', adAccountId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', adAccountId] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats', adAccountId] });
    },
    [queryClient]
  );

  const refreshCampaigns = useCallback(
    (adAccountId: string) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', adAccountId] });
    },
    [queryClient]
  );

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  return { refreshAdAccount, refreshCampaigns, refreshAll };
}
