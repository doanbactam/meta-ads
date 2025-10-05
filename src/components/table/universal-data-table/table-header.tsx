'use client';

import { Checkbox } from '@/components/ui/checkbox';
import type { TableColumn } from './types';

interface TableHeaderProps<T> {
  columns: TableColumn<T>[];
  visibleColumns: string[];
  showBulkActions: boolean;
  allSelected: boolean;
  onToggleAll: () => void;
}

export function TableHeader<T>({
  columns,
  visibleColumns,
  showBulkActions,
  allSelected,
  onToggleAll,
}: TableHeaderProps<T>) {
  return (
    <thead className="bg-muted/50 border-b border-border">
      <tr>
        {showBulkActions && (
          <th className="w-10 p-2">
            <Checkbox checked={allSelected} onCheckedChange={onToggleAll} />
          </th>
        )}
        {columns
          .filter((col) => visibleColumns.includes(col.id))
          .map((column) => (
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
  );
}
