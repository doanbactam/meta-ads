'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/shared/formatters';

interface TopCampaignsProps {
  adAccountId?: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

interface TopCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
}

export function TopCampaigns({ adAccountId, dateRange }: TopCampaignsProps) {
  const { data: topCampaigns, isLoading } = useQuery({
    queryKey: ['top-campaigns', adAccountId, dateRange],
    queryFn: async (): Promise<TopCampaign[]> => {
      if (!adAccountId) return [];

      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from.toISOString());
      if (dateRange.to) params.append('to', dateRange.to.toISOString());
      params.append('limit', '5');

      const response = await fetch(`/api/ad-accounts/${adAccountId}/top-campaigns?${params}`);
      if (!response.ok) throw new Error('Failed to fetch top campaigns');
      return response.json();
    },
    enabled: !!adAccountId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">top campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-muted/50 rounded animate-pulse"
              >
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-3 bg-muted rounded w-20" />
                </div>
                <div className="h-4 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!topCampaigns || topCampaigns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">top campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">no campaigns found</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'archived':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">top campaigns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topCampaigns.map((campaign, index) => (
            <div
              key={campaign.id}
              className="flex items-center justify-between p-3 border border-border rounded-sm hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-sm truncate max-w-48">{campaign.name}</div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-xs px-2 py-0.5 ${getStatusColor(campaign.status)}`}
                    >
                      {campaign.status.toLowerCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {campaign.impressions.toLocaleString()} impressions
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="font-medium text-sm">{formatCurrency(campaign.spend)}</div>
                <div className="flex items-center gap-1 text-xs">
                  {campaign.roas > 1 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={campaign.roas > 1 ? 'text-green-500' : 'text-red-500'}>
                    {campaign.roas.toFixed(2)}x ROAS
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
