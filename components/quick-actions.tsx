'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Play, 
  Pause, 
  Copy, 
  BarChart3, 
  Settings, 
  Download,
  RefreshCw
} from 'lucide-react';

interface QuickActionsProps {
  adAccountId?: string;
  onRefresh?: () => void;
}

export function QuickActions({ adAccountId, onRefresh }: QuickActionsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const quickActions = [
    {
      title: 'new campaign',
      description: 'create a new advertising campaign',
      icon: Plus,
      color: 'bg-primary/10 text-primary',
      action: () => {
        // TODO: Open create campaign dialog
        console.log('Create campaign');
      },
    },
    {
      title: 'bulk actions',
      description: 'pause, resume or edit multiple campaigns',
      icon: Play,
      color: 'bg-green-500/10 text-green-500',
      action: () => {
        // TODO: Open bulk actions dialog
        console.log('Bulk actions');
      },
    },
    {
      title: 'duplicate best',
      description: 'duplicate your top performing campaigns',
      icon: Copy,
      color: 'bg-blue-500/10 text-blue-500',
      action: () => {
        // TODO: Open duplicate dialog
        console.log('Duplicate campaigns');
      },
    },
    {
      title: 'performance report',
      description: 'generate detailed performance analytics',
      icon: BarChart3,
      color: 'bg-purple-500/10 text-purple-500',
      action: () => {
        // TODO: Open report dialog
        console.log('Generate report');
      },
    },
  ];

  const utilityActions = [
    {
      title: 'refresh data',
      icon: RefreshCw,
      action: handleRefresh,
      loading: isRefreshing,
    },
    {
      title: 'export data',
      icon: Download,
      action: () => {
        // TODO: Export functionality
        console.log('Export data');
      },
    },
    {
      title: 'settings',
      icon: Settings,
      action: () => {
        // TODO: Open settings
        console.log('Open settings');
      },
    },
  ];

  if (!adAccountId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">quick actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            select an ad account to see available actions
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">quick actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Actions */}
        <div className="space-y-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={action.action}
                className="w-full flex items-center gap-3 p-3 text-left border border-border rounded-sm hover:bg-muted/30 transition-colors"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-sm ${action.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {action.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Utility Actions */}
        <div className="border-t border-border pt-4">
          <div className="flex gap-1">
            {utilityActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.title}
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 flex-1"
                  onClick={action.action}
                  disabled={action.loading}
                >
                  <Icon className={`h-3.5 w-3.5 ${action.loading ? 'animate-spin' : ''}`} />
                </Button>
              );
            })}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">account status</div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
              active
            </Badge>
            <Badge variant="secondary" className="text-xs">
              synced 2m ago
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}