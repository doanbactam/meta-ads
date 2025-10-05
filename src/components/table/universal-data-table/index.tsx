'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { TablePagination } from '@/components/table/table-pagination';
import { useFacebookConnection } from '@/hooks/use-facebook-connection';
import { useUserSettings } from '@/lib/client/contexts/user-settings-context';
import { useFacebookStore } from '@/lib/client/stores/facebook-store';
import { TableBody } from './table-body';
import { TableEmptyState } from './table-empty-state';
import { TableHeader } from './table-header';
import { TableToolbar } from './table-toolbar';
import type { UniversalDataTableProps } from './types';

export function UniversalDataTable<T extends { id: string }>({
  adAccountId,
  config,
  className,
}: UniversalDataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(config.defaultColumns);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { settings } = useUserSettings();
  const { connected, loading: connectionLoading } = useFacebookConnection(adAccountId);
  const { setShowConnectionDialog } = useFacebookStore();

  // Data fetching
  const {
    data: items = [],
    isLoading: loading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [config.queryKey, adAccountId, dateRange],
    queryFn: async (): Promise<T[]> => {
      if (!adAccountId) return [];

      const params = new URLSearchParams();
      params.append('adAccountId', adAccountId);
      if (dateRange.from) params.append('from', dateRange.from.toISOString());
      if (dateRange.to) params.append('to', dateRange.to.toISOString());

      const response = await fetch(`${config.apiEndpoint}?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401 || errorData.code === 'TOKEN_EXPIRED') {
          throw new Error('FACEBOOK_TOKEN_EXPIRED');
        }

        throw new Error(errorData.error || `Failed to fetch ${config.title}`);
      }

      const data = await response.json();

      if (data.code === 'TOKEN_EXPIRED') {
        throw new Error('FACEBOOK_TOKEN_EXPIRED');
      }

      // Handle direct array response
      if (Array.isArray(data)) {
        return data;
      }

      // Handle object response - try to find the data array
      // First, try the exact queryKey (e.g., 'campaigns', 'adSets', 'ads')
      if (data[config.queryKey] && Array.isArray(data[config.queryKey])) {
        return data[config.queryKey];
      }

      // Try common variations
      const possibleKeys = [
        'campaigns',
        'adSets',
        'ads',
        'data',
        'items',
        'results',
      ];

      for (const key of possibleKeys) {
        if (data[key] && Array.isArray(data[key])) {
          return data[key];
        }
      }

      // If no array found, log the response structure for debugging
      console.warn('Could not find data array in response:', Object.keys(data));
      return [];
    },
    enabled: !!adAccountId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on token expiry errors
      if (error.message === 'FACEBOOK_TOKEN_EXPIRED') {
        return false;
      }
      return failureCount < 1;
    },
  });

  // Filter items based on search
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;

    const searchableFields = config.columns
      .filter((col) => col.accessor)
      .map((col) => {
        if (typeof col.accessor === 'function') {
          return col.accessor(item);
        }
        return item[col.accessor as keyof T];
      })
      .filter(Boolean);

    return searchableFields.some((field) =>
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

  const handleRefresh = async () => {
    toast.promise(refetch({ throwOnError: true }), {
      loading: 'Refreshing data...',
      success: 'Data refreshed successfully',
      error: 'Failed to refresh data',
    });
  };

  const handleConnect = () => {
    setShowConnectionDialog(true);
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.length === paginatedItems.length ? [] : paginatedItems.map((item) => item.id)
    );
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
      <TableToolbar
        config={config}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        selectedRows={selectedRows}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        features={features}
      />

      {/* Table */}
      <div className="rounded-sm border border-border overflow-x-auto">
        <table className="w-full text-xs min-w-[800px]">
          <TableHeader
            columns={config.columns}
            visibleColumns={visibleColumns}
            showBulkActions={features.bulkActions}
            allSelected={paginatedItems.length > 0 && selectedRows.length === paginatedItems.length}
            onToggleAll={toggleAll}
          />
          <tbody>
            {loading ? (
              <TableEmptyState
                type="loading"
                config={config}
                visibleColumnsCount={visibleColumns.length}
                showBulkActions={features.bulkActions}
                connected={connected}
                adAccountId={adAccountId}
                onRefresh={handleRefresh}
                onConnect={handleConnect}
              />
            ) : error ? (
              <TableEmptyState
                type="error"
                config={config}
                error={error as Error}
                visibleColumnsCount={visibleColumns.length}
                showBulkActions={features.bulkActions}
                connected={connected}
                adAccountId={adAccountId}
                onRefresh={handleRefresh}
                onConnect={handleConnect}
              />
            ) : totalItems === 0 ? (
              <TableEmptyState
                type="empty"
                config={config}
                visibleColumnsCount={visibleColumns.length}
                showBulkActions={features.bulkActions}
                connected={connected}
                adAccountId={adAccountId}
                onRefresh={handleRefresh}
                onConnect={handleConnect}
              />
            ) : (
              <TableBody
                items={paginatedItems}
                columns={config.columns}
                visibleColumns={visibleColumns}
                selectedRows={selectedRows}
                showBulkActions={features.bulkActions}
                onToggleRow={toggleRow}
                settings={settings}
              />
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
    </div>
  );
}

// Re-export types for convenience
export type { TableColumn, TableConfig, UniversalDataTableProps } from './types';
