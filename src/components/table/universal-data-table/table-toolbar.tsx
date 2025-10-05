'use client';

import { Copy, Edit, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { FacebookDateRangePicker } from '@/components/facebook/facebook-date-range-picker';
import { ColumnsSelector } from '@/components/table/columns-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableColumn, type TableConfig } from './types';

interface TableToolbarProps<T> {
  config: TableConfig<T>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  visibleColumns: string[];
  onColumnsChange: (columns: string[]) => void;
  selectedRows: string[];
  onRefresh: () => void;
  isRefreshing?: boolean;
  features: {
    search: boolean;
    dateRange: boolean;
    columnSelector: boolean;
    bulkActions: boolean;
  };
}

export function TableToolbar<T>({
  config,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  visibleColumns,
  onColumnsChange,
  selectedRows,
  onRefresh,
  isRefreshing = false,
  features,
}: TableToolbarProps<T>) {
  return (
    <div className="space-y-3">
      {/* Search and Date Range */}
      {(features.search || features.dateRange) && (
        <div className="flex items-center justify-between">
          {features.search && (
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={`search ${config.title.toLowerCase()}...`}
                className="h-8 pl-8 text-xs"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          {features.dateRange && (
            <FacebookDateRangePicker value={dateRange} onChange={onDateRangeChange} />
          )}
        </div>
      )}

      {/* Actions */}
      {config.actions && (
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {config.actions?.create && (
              <Button
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={config.actions?.create?.onClick}
              >
                <Plus className="h-3.5 w-3.5" />
                {config.actions?.create?.label}
              </Button>
            )}

            {features.bulkActions && selectedRows.length > 0 && (
              <>
                {config.actions?.edit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => config.actions?.edit?.onClick(selectedRows)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    {config.actions?.edit?.label}
                  </Button>
                )}

                {config.actions?.duplicate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => config.actions?.duplicate?.onClick(selectedRows)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {config.actions?.duplicate?.label}
                  </Button>
                )}

                {config.actions?.delete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => config.actions?.delete?.onClick(selectedRows)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {config.actions?.delete?.label}
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="flex gap-1.5">
            {features.columnSelector && (
              <ColumnsSelector
                columns={config.columns.map((col) => ({ id: col.id, label: col.label }))}
                visibleColumns={visibleColumns}
                onColumnsChange={onColumnsChange}
              />
            )}

            {config.actions?.custom?.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={() => action.onClick(selectedRows)}
              >
                <action.icon className="h-3.5 w-3.5" />
                {action.label}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs"
              onClick={onRefresh}
              disabled={isRefreshing}
              title={isRefreshing ? 'Refreshing...' : 'Refresh data'}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'refreshing...' : 'refresh'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
