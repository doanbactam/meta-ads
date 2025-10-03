'use client';

import { useState } from 'react';
import { Columns3, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
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

export function ColumnsSelector({ columns, visibleColumns, onColumnsChange }: ColumnsSelectorProps) {
  const [open, setOpen] = useState(false);

  const toggleColumn = (columnId: string) => {
    if (visibleColumns.includes(columnId)) {
      onColumnsChange(visibleColumns.filter((id) => id !== columnId));
    } else {
      onColumnsChange([...visibleColumns, columnId]);
    }
  };

  const selectAll = () => {
    onColumnsChange(columns.map((col) => col.id));
  };

  const clearAll = () => {
    onColumnsChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Columns3 className="w-4 h-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Customize columns</h4>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={selectAll}
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={clearAll}
              >
                Clear
              </Button>
            </div>
          </div>
          <Separator />
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {columns.map((column) => (
              <div key={column.id} className="flex items-center space-x-2">
                <Checkbox
                  id={column.id}
                  checked={visibleColumns.includes(column.id)}
                  onCheckedChange={() => toggleColumn(column.id)}
                />
                <Label
                  htmlFor={column.id}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {column.label}
                </Label>
                {visibleColumns.includes(column.id) && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
