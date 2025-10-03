'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, CreditCard as Edit2, Copy, Trash2, Calendar, ChevronLeft, ChevronRight, Columns3, ChartBar as BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnsSelector } from '@/components/columns-selector';
import { DateRangePicker } from '@/components/date-range-picker';
import { Campaign } from '@/types';
import { getCampaigns, deleteCampaign, duplicateCampaign } from '@/lib/api/campaigns';
import { formatCurrency, formatNumber, formatPercentage, formatDateRange } from '@/lib/formatters';
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  const { connected, loading: connectionLoading, connectFacebook } = useFacebookConnection(adAccountId);

  useEffect(() => {
    if (adAccountId) {
      if (connected) {
        loadFacebookCampaigns();
      } else if (!connectionLoading) {
        loadCampaigns();
      }
    }
  }, [adAccountId, connected, connectionLoading]);

  async function loadCampaigns() {
    try {
      setLoading(true);
      const data = await getCampaigns(adAccountId);
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFacebookCampaigns() {
    try {
      setLoading(true);
      const response = await fetch(`/api/facebook/campaigns?adAccountId=${adAccountId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch Facebook campaigns');
      }

      const data = await response.json();

      const formattedCampaigns: Campaign[] = data.campaigns.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        status: mapFacebookStatus(campaign.status),
        budget: parseFloat(campaign.dailyBudget || campaign.lifetimeBudget || '0') / 100,
        spent: parseFloat(campaign.insights?.spend || '0'),
        impressions: parseInt(campaign.insights?.impressions || '0'),
        clicks: parseInt(campaign.insights?.clicks || '0'),
        ctr: parseFloat(campaign.insights?.ctr || '0'),
        conversions: 0,
        cost_per_conversion: 0,
        date_start: new Date().toISOString().split('T')[0],
        date_end: new Date().toISOString().split('T')[0],
        schedule: 'All day',
      }));

      setCampaigns(formattedCampaigns);
    } catch (error) {
      console.error('Error loading Facebook campaigns:', error);
      setShowConnectDialog(true);
    } finally {
      setLoading(false);
    }
  }

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
      await Promise.all(selectedRows.map(id => deleteCampaign(id)));
      setSelectedRows([]);
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaigns:', error);
    }
  }

  async function handleDuplicate() {
    if (selectedRows.length === 0) return;

    try {
      await Promise.all(selectedRows.map(id => duplicateCampaign(id)));
      setSelectedRows([]);
      loadCampaigns();
    } catch (error) {
      console.error('Error duplicating campaigns:', error);
    }
  }

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'Eligible':
        return 'text-foreground';
      case 'Paused':
        return 'text-muted-foreground';
      case 'Disapproved':
        return 'text-muted-foreground';
      case 'Pending':
        return 'text-muted-foreground';
      case 'Ended':
        return 'text-muted-foreground';
      case 'Removed':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.length === campaigns.length ? [] : campaigns.map((c) => c.id)
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
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            breakdown
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
            report
          </Button>
        </div>
      </div>

      <div className="rounded-sm border border-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="w-10 p-2">
                <Checkbox
                  checked={selectedRows.length === campaigns.length}
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
            {campaigns.map((campaign) => (
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
                  <td className="p-2 font-medium">{campaign.name}</td>
                )}
                {visibleColumns.includes('status') && (
                  <td className="p-2">
                    <span className={`flex items-center gap-1.5 ${getStatusColor(campaign.status)}`}>
                      <span className="h-1 w-1 rounded-full bg-current"></span>
                      {campaign.status.toLowerCase()}
                    </span>
                  </td>
                )}
                {visibleColumns.includes('budget') && (
                  <td className="p-2">{formatCurrency(campaign.budget)}</td>
                )}
                {visibleColumns.includes('spent') && (
                  <td className="p-2">{formatCurrency(campaign.spent)}</td>
                )}
                {visibleColumns.includes('impressions') && (
                  <td className="p-2">{formatNumber(campaign.impressions)}</td>
                )}
                {visibleColumns.includes('clicks') && (
                  <td className="p-2">{formatNumber(campaign.clicks)}</td>
                )}
                {visibleColumns.includes('ctr') && (
                  <td className="p-2">{formatPercentage(campaign.ctr)}</td>
                )}
                {visibleColumns.includes('conversions') && (
                  <td className="p-2">{formatNumber(campaign.conversions)}</td>
                )}
                {visibleColumns.includes('cost') && (
                  <td className="p-2">{formatCurrency(campaign.cost_per_conversion)}</td>
                )}
                {visibleColumns.includes('dateRange') && (
                  <td className="p-2 text-muted-foreground">{formatDateRange(campaign.date_start, campaign.date_end)}</td>
                )}
                {visibleColumns.includes('schedule') && (
                  <td className="p-2 text-muted-foreground">{campaign.schedule}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="text-muted-foreground">total: {campaigns.length}</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-muted-foreground">1 / 97</span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">rows:</span>
            <Select defaultValue="6">
              <SelectTrigger className="h-7 w-14 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">go to:</span>
            <Input type="number" className="h-7 w-14 text-xs" defaultValue="1" />
          </div>
        </div>
      </div>
    </div>
  );
}
