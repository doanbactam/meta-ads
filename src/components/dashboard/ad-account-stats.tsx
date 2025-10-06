'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, Eye, MousePointer, TrendingDown, TrendingUp } from 'lucide-react';
import { useUserSettings } from '@/lib/client/contexts/user-settings-context';
import { formatCurrency, formatNumber } from '@/lib/shared/formatters';

interface AdAccountStatsProps {
  adAccountId?: string;
}

interface AccountStats {
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  totalCampaigns: number;
  activeCampaigns: number;
}

export function AdAccountStats({ adAccountId }: AdAccountStatsProps) {
  const { settings } = useUserSettings();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['ad-account-stats', adAccountId],
    queryFn: async (): Promise<AccountStats> => {
      if (!adAccountId) throw new Error('No ad account ID');

      const response = await fetch(`/api/ad-accounts/${adAccountId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');

      return response.json();
    },
    enabled: !!adAccountId,
    staleTime: 30 * 60 * 1000, // 30 minutes - Facebook stats don't change frequently
  });

  // Fetch ad account data to get currency
  const { data: adAccount } = useQuery({
    queryKey: ['ad-account', adAccountId],
    queryFn: async () => {
      if (!adAccountId) return null;
      const response = await fetch(`/api/ad-accounts/${adAccountId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!adAccountId,
  });

  if (!adAccountId || isLoading) {
    return (
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="animate-pulse">Loading stats...</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1">
        <DollarSign className="h-3 w-3 text-green-500" />
        <span className="font-medium">
          {formatCurrency(stats.totalSpent, adAccount?.currency || 'USD', settings.locale)}
        </span>
        <span className="text-muted-foreground">spent</span>
      </div>

      <div className="flex items-center gap-1">
        <Eye className="h-3 w-3 text-blue-500" />
        <span className="font-medium">
          {formatNumber(stats.totalImpressions, settings.locale)}
        </span>
        <span className="text-muted-foreground">impressions</span>
      </div>

      <div className="flex items-center gap-1">
        <MousePointer className="h-3 w-3 text-purple-500" />
        <span className="font-medium">
          {formatNumber(stats.totalClicks, settings.locale)}
        </span>
        <span className="text-muted-foreground">clicks</span>
      </div>

      <div className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3 text-orange-500" />
        <span className="font-medium">{stats.activeCampaigns}</span>
        <span className="text-muted-foreground">of</span>
        <span className="font-medium">{stats.totalCampaigns}</span>
        <span className="text-muted-foreground">campaigns</span>
      </div>
    </div>
  );
}
