'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TableConfig } from './types';

interface TableEmptyStateProps<T> {
  type: 'loading' | 'error' | 'empty';
  config: TableConfig<T>;
  error?: Error;
  visibleColumnsCount: number;
  showBulkActions: boolean;
  connected: boolean;
  adAccountId?: string;
  onRefresh: () => void;
  onConnect: () => void;
}

export function TableEmptyState<T>({
  type,
  config,
  error,
  visibleColumnsCount,
  showBulkActions,
  connected,
  adAccountId,
  onRefresh,
  onConnect,
}: TableEmptyStateProps<T>) {
  const colSpan = visibleColumnsCount + (showBulkActions ? 1 : 0);

  if (type === 'loading') {
    return (
      <tr>
        <td colSpan={colSpan} className="p-8 text-center text-muted-foreground">
          Loading {config.title.toLowerCase()}...
        </td>
      </tr>
    );
  }

  if (type === 'error') {
    return (
      <tr>
        <td colSpan={colSpan} className="p-8 text-center">
          <div className="space-y-3">
            <div className="text-destructive">
              {error?.message === 'FACEBOOK_TOKEN_EXPIRED'
                ? 'Facebook access token has expired'
                : `Error loading ${config.title.toLowerCase()}: ${error?.message}`}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={onRefresh}>
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
              {error?.message === 'FACEBOOK_TOKEN_EXPIRED' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-3 text-xs"
                  onClick={onConnect}
                >
                  Reconnect Facebook
                </Button>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  }

  // Empty state
  return (
    <tr>
      <td colSpan={colSpan} className="p-8 text-center">
        <div className="space-y-3">
          <div className="text-muted-foreground">
            {config.emptyState?.title || `No ${config.title.toLowerCase()} found`}
          </div>
          {config.emptyState?.description && (
            <div className="text-xs text-muted-foreground">{config.emptyState.description}</div>
          )}
          <div className="flex items-center justify-center gap-2">
            <Button size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={onRefresh}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            {adAccountId && !connected && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={onConnect}
              >
                Connect Facebook
              </Button>
            )}
            {config.emptyState?.action && (
              <Button
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={config.emptyState.action.onClick}
              >
                {config.emptyState.action.label}
              </Button>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
