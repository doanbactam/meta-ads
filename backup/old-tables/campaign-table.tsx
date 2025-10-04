'use client';

import { useState, useEffect } from 'react';
import { useCampaignsData } from '@/hooks/use-shared-data';
import { Search, Plus, CreditCard as Edit2, Copy, Trash2, Calendar, ChevronLeft, ChevronRight, Columns3, ChartBar as BarChart3, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnsSelector } from '@/components/columns-selector';
import { DateRangePicker } from '@/components/date-range-picker';
import { Campaign } from '@/types';

import { formatCurrency, formatNumber, formatPercentage, formatDateRange } from '@/lib/formatters';
import { useUserSettings } from '@/lib/contexts/user-settings-context';
import { TablePagination } from '@/components/table-pagination';
import { StatusBadge } from '@/components/status-badge';
import { useFacebookConnection } from '@/hooks/use-facebook-connection';
import { FacebookConnectDialog } from '@/components/facebook-connect-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const defaultColumns = ['name', 'status', 'budget', 'spent', 'impressions', 'clicks', 'ctr', 'conversions', 'cost', 'dateRange', 'schedule'];

interface CampaignTableProps {
  adAccountId?: string;
}

export function CampaignTable({ adAccountId }: CampaignTableProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { connected, loading: connectionLoading, connectFacebook } = useFacebookConnection(adAccountId);
  const { settings } = useUserSettings();

  const { data: campaigns = [], isLoading: loading, error, refetch, prefetchAdSets } = useCampaignsData(adAccountId);

  // No need for separate Facebook loading logic since campaigns API now handles Facebook directly

  // Pagination logic
  const totalItems = campaigns.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCampaigns = campaigns.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedRows([]); // Clear selection when changing pages
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
    setSelectedRows([]); // Clear selection
  };

  function mapFacebookStatus(status: string): Campaign['status'] {
    const statusMap: { [key: string]: Campaign['status'] } = {
      'ACTIVE': 'Eligible',
      'PAUSED': 'Paused',
      'DELETED': 'Removed',
      'ARCHIVED': 'Ended',
    };
    return statusMap[status] || 'Pending';
  }

  async function handleDelete() {
    if (selectedRows.length === 0) return;

    try {
      await Promise.all(selectedRows.map(async (id) => {
        const response = await fetch(`/api/campaigns/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete campaign');
      }));
      setSelectedRows([]);
      refetch();
    } catch (error) {
      console.error('Error deleting campaigns:', error);
    }
  }

  async function handleDuplicate() {
    if (selectedRows.length === 0) return;

    try {
      await Promise.all(selectedRows.map(async (id) => {
        const response = await fetch(`/api/campaigns/${id}/duplicate`, {
          method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to duplicate campaign');
      }));
      setSelectedRows([]);
      refetch();
    } catch (error) {
      console.error('Error duplicating campaigns:', error);
    }
  }





  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.length === paginatedCampaigns.length ? [] : paginatedCampaigns.map((c: Campaign) => c.id)
    );
  };

  const columnConfig = [
    { id: 'name', label: 'Name' },
    { id: 'status', label: 'Status' },
    { id: 'budget', label: 'Budget' },
    { id: 'spent', label: 'Spent' },
    { id: 'impressions', label: 'Impressions' },
    { id: 'clicks', label: 'Clicks' },
    { id: 'ctr', label: 'CTR' },
    { id: 'conversions', label: 'Conversions' },
    { id: 'cost', label: 'Cost per Conv' },
    { id: 'dateRange', label: 'Date Range' },
    { id: 'schedule', label: 'Schedule' },
  ];

  return (
    <div className="space-y-3">
      <FacebookConnectDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        onConnect={connectFacebook}
      />

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="search campaigns..." className="h-8 pl-8 text-xs" />
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <Button size="sm" className="h-8 gap-1.5 px-3 text-xs bg-primary hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" />
            new
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs">
            <Edit2 className="h-3.5 w-3.5" />
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
                  checked={paginatedCampaigns.length > 0 && selectedRows.length === paginatedCampaigns.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              {visibleColumns.includes('name') && (
                <th className="text-left p-2 font-medium">name</th>
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
              {visibleColumns.includes('conversions') && (
                <th className="text-left p-2 font-medium">conversions</th>
              )}
              {visibleColumns.includes('cost') && (
                <th className="text-left p-2 font-medium">cost_per_conv</th>
              )}
              {visibleColumns.includes('dateRange') && (
                <th className="text-left p-2 font-medium">date_range</th>
              )}
              {visibleColumns.includes('schedule') && (
                <th className="text-left p-2 font-medium">schedule</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-8 text-center text-muted-foreground">
                  Loading campaigns...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-8 text-center text-destructive">
                  Error loading campaigns: {error.message}
                </td>
              </tr>
            ) : totalItems === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-8 text-center">
                  <div className="space-y-3">
                    <div className="text-muted-foreground">
                      {adAccountId ? (
                        connected ? 
                          'No campaigns found in your Facebook ad account' : 
                          'Connect Facebook to view your campaigns'
                      ) : 'Select an ad account to view campaigns'}
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
                        {!connected && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 gap-1.5 px-3 text-xs"
                            onClick={() => setShowConnectDialog(true)}
                          >
                            Connect Facebook
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCampaigns.map((campaign: Campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="p-2">
                    <Checkbox
                      checked={selectedRows.includes(campaign.id)}
                      onCheckedChange={() => toggleRow(campaign.id)}
                    />
                  </td>
                  {visibleColumns.includes('name') && (
                    <td className="p-2 font-medium">{campaign.name || '--'}</td>
                  )}
                  {visibleColumns.includes('status') && (
                    <td className="p-2">
                      <StatusBadge status={campaign.status || 'unknown'} />
                    </td>
                  )}
                  {visibleColumns.includes('budget') && (
                    <td className="p-2">{formatCurrency(campaign.budget, settings.preferredCurrency, settings.preferredLocale)}</td>
                  )}
                  {visibleColumns.includes('spent') && (
                    <td className="p-2">{formatCurrency(campaign.spent, settings.preferredCurrency, settings.preferredLocale)}</td>
                  )}
                  {visibleColumns.includes('impressions') && (
                    <td className="p-2">{formatNumber(campaign.impressions, settings.preferredLocale)}</td>
                  )}
                  {visibleColumns.includes('clicks') && (
                    <td className="p-2">{formatNumber(campaign.clicks, settings.preferredLocale)}</td>
                  )}
                  {visibleColumns.includes('ctr') && (
                    <td className="p-2">{formatPercentage(campaign.ctr)}</td>
                  )}
                  {visibleColumns.includes('conversions') && (
                    <td className="p-2">{formatNumber(campaign.conversions, settings.preferredLocale)}</td>
                  )}
                  {visibleColumns.includes('cost') && (
                    <td className="p-2">{formatCurrency(campaign.cost_per_conversion, settings.preferredCurrency, settings.preferredLocale)}</td>
                  )}
                  {visibleColumns.includes('dateRange') && (
                    <td className="p-2 text-muted-foreground">{formatDateRange(campaign.date_start, campaign.date_end)}</td>
                  )}
                  {visibleColumns.includes('schedule') && (
                    <td className="p-2 text-muted-foreground">{campaign.schedule || '--'}</td>
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
