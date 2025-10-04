'use client';

import * as React from 'react';
import { format, subDays } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerCompactProps {
  value: { from: Date | undefined; to: Date | undefined };
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DateRangePickerCompact({ 
  value, 
  onChange, 
  className,
  placeholder = 'select dates',
  disabled = false
}: DateRangePickerCompactProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: value.from,
    to: value.to,
  });

  React.useEffect(() => {
    setDate({
      from: value.from,
      to: value.to,
    });
  }, [value.from, value.to]);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onChange({
      from: range?.from,
      to: range?.to,
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSelect(undefined);
  };

  const formatDateRange = (from: Date | undefined, to: Date | undefined) => {
    if (!from) return placeholder;
    
    if (!to) return format(from, 'MMM dd');
    
    // Same month
    if (format(from, 'MMM yyyy') === format(to, 'MMM yyyy')) {
      return `${format(from, 'MMM dd')} - ${format(to, 'dd')}`;
    }
    
    // Same year
    if (format(from, 'yyyy') === format(to, 'yyyy')) {
      return `${format(from, 'MMM dd')} - ${format(to, 'MMM dd')}`;
    }
    
    return `${format(from, 'MMM dd, yy')} - ${format(to, 'MMM dd, yy')}`;
  };

  const hasValue = date?.from || date?.to;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(
            'h-8 justify-start text-left text-xs font-normal w-auto min-w-[140px]',
            !hasValue && 'text-muted-foreground',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {formatDateRange(date?.from, date?.to)}
          </span>
          {hasValue && !disabled && (
            <X 
              className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50 hover:opacity-100" 
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from || new Date()}
          selected={date}
          onSelect={handleSelect}
          numberOfMonths={1}
          disabled={(date) => date > new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}