'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, Eye, MousePointer } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/shared/formatters';
import { useUserSettings } from '@/lib/client/contexts/user-settings-context';

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
    staleTime: 5 * 60 * 1000, // 5 minutes
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
        <span className="font-medium">{formatCurrency(stats.totalSpent, settings.preferredCurrency, settings.preferredLocale)}</span>
        <span className="text-muted-foreground">spent</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Eye className="h-3 w-3 text-blue-500" />
        <span className="font-medium">{formatNumber(stats.totalImpressions, settings.preferredLocale)}</span>
        <span className="text-muted-foreground">impressions</span>
      </div>
      
      <div className="flex items-center gap-1">
        <MousePointer className="h-3 w-3 text-purple-500" />
        <span className="font-medium">{formatNumber(stats.totalClicks, settings.preferredLocale)}</span>
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