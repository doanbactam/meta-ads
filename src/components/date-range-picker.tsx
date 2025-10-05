'use client';

import * as React from 'react';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/shared/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  value: { from: Date | undefined; to: Date | undefined };
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  align?: 'start' | 'center' | 'end';
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = 'Pick a date',
  disabled = false,
  align = 'start'
}: DateRangePickerProps) {
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

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[280px] justify-start text-left font-normal text-xs h-8',
              !date && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="p-3"
            classNames={{
              months: 'flex flex-col sm:flex-row gap-4',
              month: 'flex flex-col gap-4 min-w-[250px]',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-medium',
              nav: 'flex items-center gap-1',
              nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input hover:bg-accent hover:text-accent-foreground rounded-md',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-muted-foreground rounded-md w-8 font-normal text-xs text-center',
              row: 'flex w-full mt-2',
              cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md',
              day: 'h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md',
              day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
              day_today: 'bg-accent text-accent-foreground',
              day_outside: 'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
              day_disabled: 'text-muted-foreground opacity-50',
              day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
              day_hidden: 'invisible',
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}