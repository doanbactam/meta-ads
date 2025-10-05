'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/shared/formatters';

interface DashboardChartsProps {
  adAccountId?: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}

interface DailyStats {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export function DashboardCharts({ adAccountId, dateRange }: DashboardChartsProps) {
  const { data: dailyStats, isLoading } = useQuery({
    queryKey: ['daily-stats', adAccountId, dateRange],
    queryFn: async (): Promise<DailyStats[]> => {
      if (!adAccountId) return [];

      const params = new URLSearchParams();
      if (dateRange.from) params.append('from', dateRange.from.toISOString());
      if (dateRange.to) params.append('to', dateRange.to.toISOString());

      const response = await fetch(`/api/ad-accounts/${adAccountId}/daily-stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch daily stats');
      return response.json();
    },
    enabled: !!adAccountId,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">spend trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted/50 rounded animate-pulse" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">performance trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted/50 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dailyStats || dailyStats.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">spend trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              no data available
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">performance trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              no data available
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Simple bar chart visualization using CSS
  const maxSpend = Math.max(...dailyStats.map((d) => d.spend));
  const maxImpressions = Math.max(...dailyStats.map((d) => d.impressions));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Spend Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">spend trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailyStats.slice(-7).map((day, index) => (
              <div key={day.date} className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground w-16">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex-1 bg-muted rounded-sm h-4 relative overflow-hidden">
                  <div
                    className="bg-chart-1 h-full rounded-sm transition-all duration-300"
                    style={{
                      width: maxSpend > 0 ? `${(day.spend / maxSpend) * 100}%` : '0%',
                    }}
                  />
                </div>
                <div className="text-xs font-medium w-16 text-right">
                  {formatCurrency(day.spend)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">performance trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailyStats.slice(-7).map((day, index) => (
              <div key={day.date} className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground w-16">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="flex-1 space-y-1">
                  {/* Impressions bar */}
                  <div className="bg-muted rounded-sm h-2 relative overflow-hidden">
                    <div
                      className="bg-chart-2 h-full rounded-sm transition-all duration-300"
                      style={{
                        width:
                          maxImpressions > 0
                            ? `${(day.impressions / maxImpressions) * 100}%`
                            : '0%',
                      }}
                    />
                  </div>
                  {/* Clicks bar */}
                  <div className="bg-muted rounded-sm h-2 relative overflow-hidden">
                    <div
                      className="bg-chart-3 h-full rounded-sm transition-all duration-300"
                      style={{
                        width:
                          maxImpressions > 0 ? `${(day.clicks / maxImpressions) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
                <div className="text-xs space-y-1 w-16 text-right">
                  <div className="text-chart-2">{day.impressions.toLocaleString()}</div>
                  <div className="text-chart-3">{day.clicks.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-chart-2 rounded-sm" />
              impressions
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-chart-3 rounded-sm" />
              clicks
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
