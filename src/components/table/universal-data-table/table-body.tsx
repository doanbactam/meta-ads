'use client';

import { FormatBadge } from '@/components/common/format-badge';
import { StatusBadge } from '@/components/common/status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  formatCurrency,
  formatDateRange,
  formatNumber,
  formatPercentage,
} from '@/lib/shared/formatters';
import type { TableColumn } from './types';

interface TableBodyProps<T extends { id: string }> {
  items: T[];
  columns: TableColumn<T>[];
  visibleColumns: string[];
  selectedRows: string[];
  showBulkActions: boolean;
  onToggleRow: (id: string) => void;
  settings: {
    preferredCurrency: string;
    preferredLocale: string;
  };
}

export function TableBody<T extends { id: string }>({
  items,
  columns,
  visibleColumns,
  selectedRows,
  showBulkActions,
  onToggleRow,
  settings,
}: TableBodyProps<T>) {
  const renderCellValue = (column: TableColumn<T>, item: T) => {
    let value: any;

    // Extract value from item using accessor
    if (column.accessor) {
      if (typeof column.accessor === 'function') {
        try {
          value = column.accessor(item);
        } catch (error) {
          console.error(`Error in accessor for column ${column.id}:`, error);
          value = undefined;
        }
      } else {
        value = item[column.accessor];
      }
    }

    // Use custom render function if provided
    if (column.render) {
      try {
        return column.render(value, item);
      } catch (error) {
        console.error(`Error in render for column ${column.id}:`, error);
        return '--';
      }
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
        return formatCurrency(
          value !== undefined && value !== null ? value : 0,
          settings.preferredCurrency,
          settings.preferredLocale
        );
      case 'impressions':
      case 'clicks':
      case 'conversions':
      case 'engagement':
        return formatNumber(
          value !== undefined && value !== null ? value : 0,
          settings.preferredLocale
        );
      case 'ctr':
      case 'roas':
        return formatPercentage(value !== undefined && value !== null ? value : 0);
      case 'dateRange':
        return (
          <span className="text-muted-foreground">
            {formatDateRange((item as any).date_start, (item as any).date_end)}
          </span>
        );
      default:
        // Handle various types of values
        if (value === undefined || value === null) {
          return '--';
        }
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return String(value);
    }
  };

  return (
    <>
      {items.map((item) => (
        <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
          {showBulkActions && (
            <td className="p-2">
              <Checkbox
                checked={selectedRows.includes(item.id)}
                onCheckedChange={() => onToggleRow(item.id)}
              />
            </td>
          )}
          {columns
            .filter((col) => visibleColumns.includes(col.id))
            .map((column) => (
              <td key={column.id} className="p-2">
                {renderCellValue(column, item)}
              </td>
            ))}
        </tr>
      ))}
    </>
  );
}
