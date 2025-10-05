'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/common/status-badge';
import { FormatBadge } from '@/components/common/format-badge';
import { formatCurrency, formatNumber, formatPercentage, formatDateRange } from '@/lib/shared/formatters';
import { TableColumn } from './types';

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

  return (
    <tbody>
      {items.map((item) => (
        <tr
          key={item.id}
          className="border-b border-border hover:bg-muted/30 transition-colors"
        >
          {showBulkActions && (
            <td className="p-2">
              <Checkbox
                checked={selectedRows.includes(item.id)}
                onCheckedChange={() => onToggleRow(item.id)}
              />
            </td>
          )}
          {columns
            .filter(col => visibleColumns.includes(col.id))
            .map(column => (
              <td key={column.id} className="p-2">
                {renderCellValue(column, item)}
              </td>
            ))}
        </tr>
      ))}
    </tbody>
  );
}
