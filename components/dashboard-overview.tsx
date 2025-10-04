'use client';

import { useState } from 'react';
import { useOverviewStats } from '@/hooks/use-shared-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { DateRangePicker } from '@/components/date-range-picker';

import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, TrendingDown, DollarSign, Eye, MousePointer, Target, Percent, CreditCard, BarChart3 } from 'lucide-react';

interface DashboardOverviewProps {
  adAccountId?: string;
}

interface OverviewStats {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCtr: number;
  averageCpc: number;
  averageRoas: number;
  spendChange: number;
  impressionsChange: number;
  clicksChange: number;
  conversionsChange: number;
}

export function DashboardOverview({ adAccountId }: DashboardOverviewProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });

  const { data: overviewStats } = useOverviewStats(adAccountId, dateRange);

  const statCards = [
    {
      title: 'total spend',
      value: formatCurrency(overviewStats?.totalSpend || 0),
      change: overviewStats?.spendChange || 0,
      icon: DollarSign,
      color: 'text-chart-1',
    },
    {
      title: 'impressions',
      value: (overviewStats?.totalImpressions || 0).toLocaleString(),
      change: overviewStats?.impressionsChange || 0,
      icon: Eye,
      color: 'text-chart-2',
    },
    {
      title: 'clicks',
      value: (overviewStats?.totalClicks || 0).toLocaleString(),
      change: overviewStats?.clicksChange || 0,
      icon: MousePointer,
      color: 'text-chart-3',
    },
    {
      title: 'conversions',
      value: (overviewStats?.totalConversions || 0).toLocaleString(),
      change: overviewStats?.conversionsChange || 0,
      icon: Target,
      color: 'text-chart-4',
    },
  ];

  const performanceCards = [
    {
      title: 'avg ctr',
      value: `${((overviewStats?.averageCtr || 0) * 100).toFixed(2)}%`,
      change: 2.3, // Mock change data
      icon: Percent,
      color: 'text-chart-1',
    },
    {
      title: 'avg cpc',
      value: formatCurrency(overviewStats?.averageCpc || 0),
      change: -1.2, // Mock change data
      icon: CreditCard,
      color: 'text-chart-2',
    },
    {
      title: 'avg roas',
      value: `${(overviewStats?.averageRoas || 0).toFixed(2)}x`,
      change: 5.7, // Mock change data
      icon: BarChart3,
      color: 'text-chart-3',
    },
  ];

  if (!adAccountId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-muted-foreground text-sm">
          select an ad account to view dashboard
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">dashboard</h1>
          <p className="text-sm text-muted-foreground">overview of your ad account performance</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>



      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.change > 0;
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;
          
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendIcon className={`mr-1 h-3 w-3 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                    {isPositive ? '+' : ''}{stat.change.toFixed(1)}%
                  </span>
                  <span className="ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {performanceCards.map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.change > 0;
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;
          
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendIcon className={`mr-1 h-3 w-3 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                    {isPositive ? '+' : ''}{metric.change.toFixed(1)}%
                  </span>
                  <span className="ml-1">vs last period</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>


    </div>
  );
}