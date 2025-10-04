'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Edit, Copy, Trash2, ChevronLeft, ChevronRight, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnsSelector } from '@/components/columns-selector';
import { DateRangePicker } from '@/components/date-range-picker';
import { AdGroup } from '@/types';

import { formatCurrency, formatNumber, formatPercentage, formatDateRange } from '@/lib/formatters';
import { TablePagination } from '@/components/table-pagination';
import { StatusBadge } from '@/components/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const defaultColumns = ['name', 'campaign', 'status', 'budget', 'spent', 'impressions', 'clicks', 'ctr', 'cpc', 'conversions', 'dateRange'];

interface AdGroupsTableProps {
  adAccountId?: string;
}

export function AdGroupsTable({ adAccountId }: AdGroupsTableProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: adSets = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['ad-sets', adAccountId],
    queryFn: async () => {
      if (!adAccountId) return [];
      const response = await fetch(`/api/ad-sets?adAccountId=${adAccountId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch ad sets');
      }
      
      const data = await response.json();
      return data.adSets || [];
    },
    enabled: !!adAccountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error.message.includes('Authentication required')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Pagination logic
  const totalItems = adSets.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAdSets = adSets.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedRows([]);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    setSelectedRows([]);
  };

  async function handleDelete() {
    if (selectedRows.length === 0) return;

    try {
      await Promise.all(selectedRows.map(async (id) => {
        const response = await fetch(`/api/ad-sets/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete ad set');
      }));
      setSelectedRows([]);
      refetch();
    } catch (error) {
      console.error('Error deleting ad sets:', error);
    }
  }

  async function handleDuplicate() {
    if (selectedRows.length === 0) return;

    try {
      await Promise.all(selectedRows.map(async (id) => {
        const response = await fetch(`/api/ad-sets/${id}/duplicate`, {
          method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to duplicate ad set');
      }));
      setSelectedRows([]);
      refetch();
    } catch (error) {
      console.error('Error duplicating ad sets:', error);
    }
  }



  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.length === paginatedAdSets.length ? [] : paginatedAdSets.map((c: any) => c.id)
    );
  };

  const columnConfig = [
    { id: 'name', label: 'Name' },
    { id: 'campaign', label: 'Campaign' },
    { id: 'status', label: 'Status' },
    { id: 'budget', label: 'Budget' },
    { id: 'spent', label: 'Spent' },
    { id: 'impressions', label: 'Impressions' },
    { id: 'clicks', label: 'Clicks' },
    { id: 'ctr', label: 'CTR' },
    { id: 'cpc', label: 'CPC' },
    { id: 'conversions', label: 'Conversions' },
    { id: 'dateRange', label: 'Date Range' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="search ad sets..." className="h-8 pl-8 text-xs" />
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <Button size="sm" className="h-8 gap-1.5 px-3 text-xs">
            <Plus className="h-3.5 w-3.5" />
            new
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs">
            <Edit className="h-3.5 w-3.5" />
            edit
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={handleDuplicate} disabled={selectedRows.length === 0}>
            <Copy className="h-3.5 w-3.5" />
            duplicate
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={handleDelete} disabled={selectedRows.length === 0}>
            <Trash2 className="h-3.5 w-3.5" />
            remove
          </Button>
        </div>
        <div className="flex gap-1.5">
          <ColumnsSelector
            columns={columnConfig}
            visibleColumns={visibleColumns}
            onColumnsChange={setVisibleColumns}
          />

        </div>
      </div>

      <div className="rounded-sm border border-border overflow-x-auto">
        <table className="w-full text-xs min-w-[800px]">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="w-10 p-2">
                <Checkbox
                  checked={paginatedAdSets.length > 0 && selectedRows.length === paginatedAdSets.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              {visibleColumns.includes('name') && (
                <th className="text-left p-2 font-medium">name</th>
              )}
              {visibleColumns.includes('campaign') && (
                <th className="text-left p-2 font-medium">campaign</th>
              )}
              {visibleColumns.includes('status') && (
                <th className="text-left p-2 font-medium">status</th>
              )}
              {visibleColumns.includes('budget') && (
                <th className="text-left p-2 font-medium">budget</th>
              )}
              {visibleColumns.includes('spent') && (
                <th className="text-left p-2 font-medium">spent</th>
              )}
              {visibleColumns.includes('impressions') && (
                <th className="text-left p-2 font-medium">impressions</th>
              )}
              {visibleColumns.includes('clicks') && (
                <th className="text-left p-2 font-medium">clicks</th>
              )}
              {visibleColumns.includes('ctr') && (
                <th className="text-left p-2 font-medium">ctr</th>
              )}
              {visibleColumns.includes('cpc') && (
                <th className="text-left p-2 font-medium">cpc</th>
              )}
              {visibleColumns.includes('conversions') && (
                <th className="text-left p-2 font-medium">conversions</th>
              )}
              {visibleColumns.includes('dateRange') && (
                <th className="text-left p-2 font-medium">date_range</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-8 text-center text-muted-foreground">
                  Loading ad sets...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-8 text-center text-destructive">
                  Error loading ad sets: {error.message}
                </td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-8 text-center">
                  <div className="space-y-3">
                    <div className="text-muted-foreground">
                      {adAccountId ? 'No ad sets found for this ad account' : 'Select an ad account to view ad sets'}
                    </div>
                    {adAccountId && (
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          size="sm" 
                          className="h-8 gap-1.5 px-3 text-xs"
                          onClick={() => refetch()}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Refresh
                        </Button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedAdSets.map((adSet: any) => (
                <tr
                  key={adSet.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="p-2">
                    <Checkbox
                      checked={selectedRows.includes(adSet.id)}
                      onCheckedChange={() => toggleRow(adSet.id)}
                    />
                  </td>
                  {visibleColumns.includes('name') && (
                    <td className="p-2 font-medium">{adSet.name || '--'}</td>
                  )}
                  {visibleColumns.includes('campaign') && (
                    <td className="p-2 text-muted-foreground">{adSet.campaign_name || '--'}</td>
                  )}
                  {visibleColumns.includes('status') && (
                    <td className="p-2">
                      <StatusBadge status={adSet.status || 'unknown'} />
                    </td>
                  )}
                  {visibleColumns.includes('budget') && (
                    <td className="p-2">{formatCurrency(adSet.budget)}</td>
                  )}
                  {visibleColumns.includes('spent') && (
                    <td className="p-2">{formatCurrency(adSet.spent)}</td>
                  )}
                  {visibleColumns.includes('impressions') && (
                    <td className="p-2">{formatNumber(adSet.impressions)}</td>
                  )}
                  {visibleColumns.includes('clicks') && (
                    <td className="p-2">{formatNumber(adSet.clicks)}</td>
                  )}
                  {visibleColumns.includes('ctr') && (
                    <td className="p-2">{formatPercentage(adSet.ctr)}</td>
                  )}
                  {visibleColumns.includes('cpc') && (
                    <td className="p-2">{formatCurrency(adSet.cpc)}</td>
                  )}
                  {visibleColumns.includes('conversions') && (
                    <td className="p-2">{formatNumber(adSet.conversions)}</td>
                  )}
                  {visibleColumns.includes('dateRange') && (
                    <td className="p-2 text-muted-foreground">{formatDateRange(adSet.date_start, adSet.date_end)}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
