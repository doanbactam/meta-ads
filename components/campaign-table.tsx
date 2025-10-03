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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const defaultColumns = ['name', 'status', 'budget', 'spent', 'impressions', 'clicks', 'ctr', 'conversions', 'cost', 'dateRange', 'schedule'];

export function CampaignTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      setLoading(true);
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
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
        return 'text-green-500';
      case 'Paused':
        return 'text-yellow-500';
      case 'Disapproved':
        return 'text-red-500';
      case 'Pending':
        return 'text-orange-500';
      case 'Ended':
        return 'text-gray-500';
      case 'Removed':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search" className="pl-10" />
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            New campaign
          </Button>
          <Button variant="outline" className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDuplicate} disabled={selectedRows.length === 0}>
            <Copy className="w-4 h-4" />
            Duplicate
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleDelete} disabled={selectedRows.length === 0}>
            <Trash2 className="w-4 h-4" />
            Remove
          </Button>
        </div>
        <div className="flex gap-2">
          <ColumnsSelector
            columns={columnConfig}
            visibleColumns={visibleColumns}
            onColumnsChange={setVisibleColumns}
          />
          <Button variant="outline" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Breakdown
          </Button>
          <Button variant="outline" className="gap-2">
            Report
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-card border-b border-border">
            <tr>
              <th className="w-12 p-4">
                <Checkbox
                  checked={selectedRows.length === campaigns.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              {visibleColumns.includes('name') && (
                <th className="text-left p-4 text-sm font-medium">Name</th>
              )}
              {visibleColumns.includes('status') && (
                <th className="text-left p-4 text-sm font-medium">Status</th>
              )}
              {visibleColumns.includes('budget') && (
                <th className="text-left p-4 text-sm font-medium">Budget</th>
              )}
              {visibleColumns.includes('spent') && (
                <th className="text-left p-4 text-sm font-medium">Spent</th>
              )}
              {visibleColumns.includes('impressions') && (
                <th className="text-left p-4 text-sm font-medium">Impressions</th>
              )}
              {visibleColumns.includes('clicks') && (
                <th className="text-left p-4 text-sm font-medium">Clicks</th>
              )}
              {visibleColumns.includes('ctr') && (
                <th className="text-left p-4 text-sm font-medium">CTR</th>
              )}
              {visibleColumns.includes('conversions') && (
                <th className="text-left p-4 text-sm font-medium">Conversions</th>
              )}
              {visibleColumns.includes('cost') && (
                <th className="text-left p-4 text-sm font-medium">Cost per Conv</th>
              )}
              {visibleColumns.includes('dateRange') && (
                <th className="text-left p-4 text-sm font-medium">Date Range</th>
              )}
              {visibleColumns.includes('schedule') && (
                <th className="text-left p-4 text-sm font-medium">Schedule</th>
              )}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="border-b border-border hover:bg-muted/50 transition-colors"
              >
                <td className="p-4">
                  <Checkbox
                    checked={selectedRows.includes(campaign.id)}
                    onCheckedChange={() => toggleRow(campaign.id)}
                  />
                </td>
                {visibleColumns.includes('name') && (
                  <td className="p-4 text-sm font-medium">{campaign.name}</td>
                )}
                {visibleColumns.includes('status') && (
                  <td className="p-4">
                    <span className={`text-sm flex items-center gap-1 ${getStatusColor(campaign.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {campaign.status}
                    </span>
                  </td>
                )}
                {visibleColumns.includes('budget') && (
                  <td className="p-4 text-sm">{formatCurrency(campaign.budget)}</td>
                )}
                {visibleColumns.includes('spent') && (
                  <td className="p-4 text-sm text-orange-500">{formatCurrency(campaign.spent)}</td>
                )}
                {visibleColumns.includes('impressions') && (
                  <td className="p-4 text-sm">{formatNumber(campaign.impressions)}</td>
                )}
                {visibleColumns.includes('clicks') && (
                  <td className="p-4 text-sm">{formatNumber(campaign.clicks)}</td>
                )}
                {visibleColumns.includes('ctr') && (
                  <td className="p-4 text-sm text-blue-500">{formatPercentage(campaign.ctr)}</td>
                )}
                {visibleColumns.includes('conversions') && (
                  <td className="p-4 text-sm text-green-500">{formatNumber(campaign.conversions)}</td>
                )}
                {visibleColumns.includes('cost') && (
                  <td className="p-4 text-sm">{formatCurrency(campaign.cost_per_conversion)}</td>
                )}
                {visibleColumns.includes('dateRange') && (
                  <td className="p-4 text-sm text-muted-foreground">{formatDateRange(campaign.date_start, campaign.date_end)}</td>
                )}
                {visibleColumns.includes('schedule') && (
                  <td className="p-4 text-sm text-muted-foreground">{campaign.schedule}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">Total: {campaigns.length}</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-muted-foreground">1 / 97</span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Rows per page:</span>
            <Select defaultValue="6">
              <SelectTrigger className="w-16 h-8">
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
            <span className="text-muted-foreground">Go to</span>
            <Input type="number" className="w-16 h-8" defaultValue="1" />
          </div>
        </div>
      </div>
    </div>
  );
}
