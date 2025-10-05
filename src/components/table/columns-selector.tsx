'use client';

import { Check, Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

interface Column {
  id: string;
  label: string;
}

interface ColumnsSelectorProps {
  columns: Column[];
  visibleColumns: string[];
  onColumnsChange: (columns: string[]) => void;
}

export function ColumnsSelector({
  columns,
  visibleColumns,
  onColumnsChange,
}: ColumnsSelectorProps) {
  const toggleColumn = (columnId: string) => {
    const isVisible = visibleColumns.includes(columnId);
    onColumnsChange(
      isVisible ? visibleColumns.filter((id) => id !== columnId) : [...visibleColumns, columnId]
    );
  };

  const selectAll = () => onColumnsChange(columns.map((col) => col.id));
  const clearAll = () => onColumnsChange([]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs">
          <Columns3 className="h-3.5 w-3.5" />
          columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">customize columns</h4>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>
                select all
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
                clear
              </Button>
            </div>
          </div>
          <Separator />
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
            {columns.map((column) => {
              const isChecked = visibleColumns.includes(column.id);
              return (
                <div key={column.id} className="flex items-center gap-2">
                  <Checkbox
                    id={column.id}
                    checked={isChecked}
                    onCheckedChange={() => toggleColumn(column.id)}
                  />
                  <Label htmlFor={column.id} className="text-sm font-normal cursor-pointer flex-1">
                    {column.label}
                  </Label>
                  {isChecked && <Check className="h-4 w-4 text-primary shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
