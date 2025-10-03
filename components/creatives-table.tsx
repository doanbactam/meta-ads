'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, CreditCard as Edit2, Copy, Trash2, Calendar, ChevronLeft, ChevronRight, Columns3, ChartBar as BarChart3, Eye, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ColumnsSelector } from '@/components/columns-selector';
import { DateRangePicker } from '@/components/date-range-picker';
import { Creative } from '@/types';
import { getCreatives, deleteCreative, duplicateCreative } from '@/lib/api/creatives';
import { formatCurrency, formatNumber, formatPercentage, formatDateRange } from '@/lib/formatters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const defaultColumns = ['name', 'adGroup', 'format', 'status', 'impressions', 'clicks', 'ctr', 'engagement', 'spend', 'roas', 'dateRange'];

export function CreativesTable() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    loadCreatives();
  }, []);

  async function loadCreatives() {
    try {
      setLoading(true);
      const data = await getCreatives();
      setCreatives(data);
    } catch (error) {
      console.error('Error loading creatives:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (selectedRows.length === 0) return;

    try {
      await Promise.all(selectedRows.map(id => deleteCreative(id)));
      setSelectedRows([]);
      loadCreatives();
    } catch (error) {
      console.error('Error deleting creatives:', error);
    }
  }

  async function handleDuplicate() {
    if (selectedRows.length === 0) return;

    try {
      await Promise.all(selectedRows.map(id => duplicateCreative(id)));
      setSelectedRows([]);
      loadCreatives();
    } catch (error) {
      console.error('Error duplicating creatives:', error);
    }
  }

  const getStatusColor = (status: Creative['status']) => {
    switch (status) {
      case 'Active':
        return 'text-green-500';
      case 'Paused':
        return 'text-yellow-500';
      case 'Review':
        return 'text-blue-500';
      case 'Rejected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getFormatColor = (format: Creative['format']) => {
    switch (format) {
      case 'Image':
        return 'bg-blue-500/20 text-blue-500';
      case 'Video':
        return 'bg-purple-500/20 text-purple-500';
      case 'Carousel':
        return 'bg-orange-500/20 text-orange-500';
      case 'Story':
        return 'bg-pink-500/20 text-pink-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.length === creatives.length ? [] : creatives.map((c) => c.id)
    );
  };

  const columnConfig = [
    { id: 'name', label: 'Name' },
    { id: 'adGroup', label: 'Ad Group' },
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
            New creative
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
                  checked={selectedRows.length === creatives.length}
                  onCheckedChange={toggleAll}
                />
              </th>
              {visibleColumns.includes('name') && (
                <th className="text-left p-4 text-sm font-medium">Name</th>
              )}
              {visibleColumns.includes('adGroup') && (
                <th className="text-left p-4 text-sm font-medium">Ad Group</th>
              )}
              {visibleColumns.includes('format') && (
                <th className="text-left p-4 text-sm font-medium">Format</th>
              )}
              {visibleColumns.includes('status') && (
                <th className="text-left p-4 text-sm font-medium">Status</th>
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
              {visibleColumns.includes('engagement') && (
                <th className="text-left p-4 text-sm font-medium">Engagement</th>
              )}
              {visibleColumns.includes('spend') && (
                <th className="text-left p-4 text-sm font-medium">Spend</th>
              )}
              {visibleColumns.includes('roas') && (
                <th className="text-left p-4 text-sm font-medium">ROAS</th>
              )}
              {visibleColumns.includes('dateRange') && (
                <th className="text-left p-4 text-sm font-medium">Date Range</th>
              )}
              <th className="w-24 p-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {creatives.map((creative) => (
              <tr
                key={creative.id}
                className="border-b border-border hover:bg-muted/50 transition-colors"
              >
                <td className="p-4">
                  <Checkbox
                    checked={selectedRows.includes(creative.id)}
                    onCheckedChange={() => toggleRow(creative.id)}
                  />
                </td>
                {visibleColumns.includes('name') && (
                  <td className="p-4 text-sm font-medium">{creative.name}</td>
                )}
                {visibleColumns.includes('adGroup') && (
                  <td className="p-4 text-sm text-muted-foreground">Ad Group</td>
                )}
                {visibleColumns.includes('format') && (
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getFormatColor(creative.format)}`}>
                      {creative.format}
                    </span>
                  </td>
                )}
                {visibleColumns.includes('status') && (
                  <td className="p-4">
                    <span className={`text-sm flex items-center gap-1 ${getStatusColor(creative.status)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {creative.status}
                    </span>
                  </td>
                )}
                {visibleColumns.includes('impressions') && (
                  <td className="p-4 text-sm">{formatNumber(creative.impressions)}</td>
                )}
                {visibleColumns.includes('clicks') && (
                  <td className="p-4 text-sm">{formatNumber(creative.clicks)}</td>
                )}
                {visibleColumns.includes('ctr') && (
                  <td className="p-4 text-sm text-blue-500">{formatPercentage(creative.ctr)}</td>
                )}
                {visibleColumns.includes('engagement') && (
                  <td className="p-4 text-sm text-green-500">{formatPercentage(creative.engagement)}</td>
                )}
                {visibleColumns.includes('spend') && (
                  <td className="p-4 text-sm text-orange-500">{formatCurrency(creative.spend)}</td>
                )}
                {visibleColumns.includes('roas') && (
                  <td className="p-4 text-sm text-green-500 font-medium">{creative.roas.toFixed(1)}x</td>
                )}
                {visibleColumns.includes('dateRange') && (
                  <td className="p-4 text-sm text-muted-foreground">{formatDateRange(creative.date_start, creative.date_end)}</td>
                )}
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">Total: {creatives.length}</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-muted-foreground">1 / 32</span>
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
