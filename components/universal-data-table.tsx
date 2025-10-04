'use client';

import { useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFacebookConnection } from '@/hooks/use-facebook-connection';
import { FacebookConnectDialog } from '@/components/facebook-connect-dialog';
import { Search, Plus, Edit, Copy, Trash2, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnsSelector } from '@/components/columns-selector';
import { DateRangePicker } from '@/components/date-range-picker';
import { TablePagination } from '@/components/table-pagination';
import { StatusBadge } from '@/components/status-badge';
import { FormatBadge } from '@/components/format-badge';
import { formatCurrency, formatNumber, formatPercentage, formatDateRange } from '@/lib/formatters';
import { useUserSettings } from '@/lib/contexts/user-settings-context';

// Generic column definition
export interface TableColumn<T = any> {
  id: string;
  label: string;
  accessor?: keyof T | ((item: T) => any);
  render?: (value: any, item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

// Generic table configuration
export interface TableConfig<T = any> {
  // Data fetching
  queryKey: string;
  apiEndpoint: string;
  
  // Display
  title: string;
  columns: TableColumn<T>[];
  defaultColumns: string[];
  
  // Actions
  actions?: {
    create?: {
      label: string;
      onClick: () => void;
    };
    edit?: {
      label: string;
      onClick: (selectedIds: string[]) => void;
    };
    duplicate?: {
      label: string;
      onClick: (selectedIds: string[]) => void;
    };
    delete?: {
      label: string;
      onClick: (selectedIds: string[]) => void;
    };
    custom?: Array<{
      label: string;
      icon: any;
      onClick: (selectedIds: string[]) => void;
      variant?: 'default' | 'outline' | 'ghost';
    }>;
  };
  
  // Features
  features?: {
    search?: boolean;
    dateRange?: boolean;
    columnSelector?: boolean;
    pagination?: boolean;
    bulkActions?: boolean;
  };
  
  // Customization
  emptyState?: {
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}

interface UniversalDataTableProps<T = any> {
  adAccountId?: string;
  config: TableConfig<T>;
  className?: string;
}

export function UniversalDataTable<T extends { id: string }>({ 
  adAccountId, 
  config,
  className 
}: UniversalDataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(config.defaultColumns);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ 
    from: Date | undefined; 
    to: Date | undefined 
  }>({
    from: undefined,
    to: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  const { settings } = useUserSettings();
  const { connected, loading: connectionLoading, connectFacebook } = useFacebookConnection(adAccountId);

  // Data fetching
  const { data: items = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: [config.queryKey, adAccountId, dateRange, searchQuery],
    queryFn: async (): Promise<T[]> => {
      if (!adAccountId) return [];
      
      const params = new URLSearchParams();
      params.append('adAccountId', adAccountId);
      if (dateRange.from) params.append('from', dateRange.from.toISOString());
      if (dateRange.to) params.append('to', dateRange.to.toISOString());
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`${config.apiEndpoint}?${params}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch ${config.title}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : data[config.queryKey] || [];
    },
    enabled: !!adAccountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Filter items based on search
  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    
    const searchableFields = config.columns
      .filter(col => col.accessor)
      .map(col => {
        if (typeof col.accessor === 'function') {
          return col.accessor(item);
        }
        return item[col.accessor as keyof T];
      })
      .filter(Boolean);
    
    return searchableFields.some(field => 
      String(field).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Pagination
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedRows([]);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    setSelectedRows([]);
  };

  const toggleRow = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows(prev =>
      prev.length === paginatedItems.length ? [] : paginatedItems.map(item => item.id)
    );
  };

  // Render cell value
  const renderCellValue = (column: TableColumn<T>, item: T) => {
    let value: any;
    
    if (column.accessor) {
      if (typeof column.accessor === 'function') {
        value = column.accessor(item);
      } else {
        value = item[column.accessor];
      }
    }

    if (column.render) {
      return column.render(value, item);
    }

    // Default renderers based on column id
    switch (column.id) {
      case 'status':
        return <StatusBadge status={value || 'unknown'} />;
      case 'format':
        return <FormatBadge format={value || 'unknown'} />;
      case 'budget':
      case 'spent':
      case 'spend':
      case 'cpc':
      case 'cost':
      case 'costPerConversion':
        return formatCurrency(value, settings.preferredCurrency, settings.preferredLocale);
      case 'impressions':
      case 'clicks':
      case 'conversions':
      case 'engagement':
        return formatNumber(value, settings.preferredLocale);
      case 'ctr':
      case 'roas':
        return formatPercentage(value);
      case 'dateRange':
        return <span className="text-muted-foreground">{formatDateRange((item as any).date_start, (item as any).date_end)}</span>;
      default:
        return value || '--';
    }
  };

  const features = {
    search: true,
    dateRange: true,
    columnSelector: true,
    pagination: true,
    bulkActions: true,
    ...config.features,
  };

  return (
    <div className={`space-y-3 ${className || ''}`}>
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
          {features.dateRange && (
            <DateRangePicker value={dateRange} onChange={setDateRange} />
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
                columns={config.columns.map(col => ({ id: col.id, label: col.label }))}
                visibleColumns={visibleColumns}
                onColumnsChange={setVisibleColumns}
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
              onClick={() => refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              refresh
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-sm border border-border overflow-x-auto">
        <table className="w-full text-xs min-w-[800px]">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {features.bulkActions && (
                <th className="w-10 p-2">
                  <Checkbox
                    checked={paginatedItems.length > 0 && selectedRows.length === paginatedItems.length}
                    onCheckedChange={toggleAll}
                  />
                </th>
              )}
              {config.columns
                .filter(col => visibleColumns.includes(col.id))
                .map(column => (
                  <th 
                    key={column.id} 
                    className="text-left p-2 font-medium"
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + (features.bulkActions ? 1 : 0)} className="p-8 text-center text-muted-foreground">
                  Loading {config.title.toLowerCase()}...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={visibleColumns.length + (features.bulkActions ? 1 : 0)} className="p-8 text-center">
                  <div className="space-y-3">
                    <div className="text-destructive">
                      {error.message === 'FACEBOOK_TOKEN_EXPIRED' 
                        ? 'Facebook access token has expired' 
                        : `Error loading ${config.title.toLowerCase()}: ${error.message}`
                      }
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        size="sm" 
                        className="h-8 gap-1.5 px-3 text-xs"
                        onClick={() => refetch()}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry
                      </Button>
                      {error.message === 'FACEBOOK_TOKEN_EXPIRED' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1.5 px-3 text-xs"
                          onClick={() => setShowConnectDialog(true)}
                        >
                          Reconnect Facebook
                        </Button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (features.bulkActions ? 1 : 0)} className="p-8 text-center">
                  <div className="space-y-3">
                    <div className="text-muted-foreground">
                      {config.emptyState?.title || `No ${config.title.toLowerCase()} found`}
                    </div>
                    {config.emptyState?.description && (
                      <div className="text-xs text-muted-foreground">
                        {config.emptyState.description}
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        size="sm" 
                        className="h-8 gap-1.5 px-3 text-xs"
                        onClick={() => refetch()}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                      </Button>
                      {adAccountId && !connected && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1.5 px-3 text-xs"
                          onClick={() => setShowConnectDialog(true)}
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
            ) : (
              paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  {features.bulkActions && (
                    <td className="p-2">
                      <Checkbox
                        checked={selectedRows.includes(item.id)}
                        onCheckedChange={() => toggleRow(item.id)}
                      />
                    </td>
                  )}
                  {config.columns
                    .filter(col => visibleColumns.includes(col.id))
                    .map(column => (
                      <td key={column.id} className="p-2">
                        {renderCellValue(column, item)}
                      </td>
                    ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {features.pagination && (
        <TablePagination
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Facebook Connect Dialog */}
      <FacebookConnectDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        onConnect={connectFacebook}
      />
    </div>
  );
}