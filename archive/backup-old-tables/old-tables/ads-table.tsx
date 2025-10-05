'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Edit, Copy, Trash2, ChevronLeft, ChevronRight, BarChart3, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnsSelector } from '@/components/columns-selector';
import { DateRangePicker } from '@/components/date-range-picker';
import { Ad } from '@/types';

import { formatCurrency, formatNumber, formatPercentage, formatDateRange } from '@/lib/shared/formatters';
import { TablePagination } from '@/components/table-pagination';
import { StatusBadge } from '@/components/status-badge';
import { FormatBadge } from '@/components/format-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const defaultColumns = ['name', 'adSet', 'format', 'status', 'impressions', 'clicks', 'ctr', 'engagement', 'spend', 'roas', 'dateRange'];

interface AdsTableProps {
  adAccountId?: string;
}

export function AdsTable({ adAccountId }: AdsTableProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: ads = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['ads', adAccountId],
    queryFn: async () => {
      if (!adAccountId) return [];
      const response = await fetch(`/api/ads?adAccountId=${adAccountId}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch ads');
      }
      
      const data = await response.json();
      return data.ads || [];
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
  const totalItems = ads.length;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAds = ads.slice(startIndex, endIndex);

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
        const response = await fetch(`/api/ads/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete ad');
      }));
      setSelectedRows([]);
      refetch();
    } catch (error) {
      console.error('Error deleting ads:', error);
    }
  }

  async function handleDuplicate() {
    if (selectedRows.length === 0) return;

    try {
      await Promise.all(selectedRows.map(async (id) => {
        const response = await fetch(`/api/ads/${id}/duplicate`, {
          method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to duplicate ad');
      }));
      setSelectedRows([]);
      refetch();
    } catch (error) {
      console.error('Error duplicating ads:', error);
    }
  }





  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.length === paginatedAds.length ? [] : paginatedAds.map((ad: Ad) => ad.id)
    );
  };

  const columnConfig = [
    { id: 'name', label: 'Name' },
    { id: 'adSet', label: 'Ad Set' },
    { id: 'format', label: 'Format' },
    { id: 'status', label: 'Status' },
    { id: 'impressions', label: 'Impressions' },
    { id: 'clicks', label: 'Clicks' },
    { id: 'ctr', label: 'CTR' },
    { id: 'engagement', label: 'Engagement' },
    { id: 'spend', label: 'Spend' },
    { id: 'roas', label: 'ROAS' },
    { id: 'dateRange', label: 'Date Range' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="search ads..." className="h-8 pl-8 text-xs" />
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
                  checked={paginatedAds.length > 0 && selectedRows.length === paginatedAds.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              {visibleColumns.includes('name') && (
                <th className="text-left p-2 font-medium">name</th>
              )}
              {visibleColumns.includes('adSet') && (
                <th className="text-left p-2 font-medium">ad_set</th>
              )}
              {visibleColumns.includes('format') && (
                <th className="text-left p-2 font-medium">format</th>
              )}
              {visibleColumns.includes('status') && (
                <th className="text-left p-2 font-medium">status</th>
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
              {visibleColumns.includes('engagement') && (
                <th className="text-left p-2 font-medium">engagement</th>
              )}
              {visibleColumns.includes('spend') && (
                <th className="text-left p-2 font-medium">spend</th>
              )}
              {visibleColumns.includes('roas') && (
                <th className="text-left p-2 font-medium">roas</th>
              )}
              {visibleColumns.includes('dateRange') && (
                <th className="text-left p-2 font-medium">date_range</th>
              )}
              <th className="w-20 p-2 font-medium">actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="p-8 text-center text-muted-foreground">
                  Loading ads...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="p-8 text-center text-destructive">
                  Error loading ads: {error.message}
                </td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="p-8 text-center">
                  <div className="space-y-3">
                    <div className="text-muted-foreground">
                      {adAccountId ? 'No ads found for this ad account' : 'Select an ad account to view ads'}
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
              paginatedAds.map((ad: Ad) => (
              <tr
                key={ad.id}
                className="border-b border-border hover:bg-muted/30 transition-colors"
              >
                <td className="p-2">
                  <Checkbox
                    checked={selectedRows.includes(ad.id)}
                    onCheckedChange={() => toggleRow(ad.id)}
                  />
                </td>
                {visibleColumns.includes('name') && (
                  <td className="p-2 font-medium">{ad.name}</td>
                )}
                {visibleColumns.includes('adSet') && (
                  <td className="p-2 text-muted-foreground">ad_set</td>
                )}
                {visibleColumns.includes('format') && (
                  <td className="p-2">
                    <FormatBadge format={ad.format || 'unknown'} />
                  </td>
                )}
                {visibleColumns.includes('status') && (
                  <td className="p-2">
                    <StatusBadge status={ad.status || 'unknown'} />
                  </td>
                )}
                {visibleColumns.includes('impressions') && (
                  <td className="p-2">{formatNumber(ad.impressions)}</td>
                )}
                {visibleColumns.includes('clicks') && (
                  <td className="p-2">{formatNumber(ad.clicks)}</td>
                )}
                {visibleColumns.includes('ctr') && (
                  <td className="p-2">{formatPercentage(ad.ctr)}</td>
                )}
                {visibleColumns.includes('engagement') && (
                  <td className="p-2">{formatPercentage(ad.engagement)}</td>
                )}
                {visibleColumns.includes('spend') && (
                  <td className="p-2">{formatCurrency(ad.spend)}</td>
                )}
                {visibleColumns.includes('roas') && (
                  <td className="p-2 font-medium">{ad.roas.toFixed(1)}x</td>
                )}
                {visibleColumns.includes('dateRange') && (
                  <td className="p-2 text-muted-foreground">{formatDateRange(ad.date_start, ad.date_end)}</td>
                )}
                <td className="p-2">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
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
