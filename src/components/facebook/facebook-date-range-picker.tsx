'use client';

import { endOfDay, endOfMonth, format, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/shared/utils';

interface FacebookDateRangePickerProps {
  value: { from: Date | undefined; to: Date | undefined };
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  className?: string;
  disabled?: boolean;
}

type DatePreset = {
  label: string;
  value: () => { from: Date; to: Date };
};

const createPreset = (label: string, getValue: () => { from: Date; to: Date }): DatePreset => ({
  label,
  value: getValue,
});

const now = () => new Date();
const datePresets: DatePreset[] = [
  createPreset('Today', () => ({ from: startOfDay(now()), to: endOfDay(now()) })),
  createPreset('Yesterday', () => {
    const yesterday = subDays(now(), 1);
    return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
  }),
  createPreset('Last 7 days', () => ({ from: startOfDay(subDays(now(), 6)), to: endOfDay(now()) })),
  createPreset('Last 14 days', () => ({ from: startOfDay(subDays(now(), 13)), to: endOfDay(now()) })),
  createPreset('Last 30 days', () => ({ from: startOfDay(subDays(now(), 29)), to: endOfDay(now()) })),
  createPreset('This month', () => ({ from: startOfMonth(now()), to: endOfDay(now()) })),
  createPreset('Last month', () => {
    const lastMonth = subMonths(now(), 1);
    return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
  }),
];

const matchesPreset = (from: Date, to: Date, preset: DatePreset): boolean => {
  const range = preset.value();
  return from.getTime() === range.from.getTime() && to.getTime() === range.to.getTime();
};

export function FacebookDateRangePicker({
  value,
  onChange,
  className,
  disabled = false,
}: FacebookDateRangePickerProps) {
  const [date, setDate] = useState<DateRange>({ from: value.from, to: value.to });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setDate({ from: value.from, to: value.to });
  }, [value.from, value.to]);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to });
      setIsOpen(false);
    } else if (range?.from) {
      onChange({ from: range.from, to: range.from });
    }
  };

  const handlePresetSelect = (preset: DatePreset) => {
    const range = preset.value();
    setDate(range);
    onChange(range);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!date?.from) return 'Select date range';
    if (!date.to) return format(date.from, 'MMM d, yyyy');

    const matchedPreset = datePresets.find((preset) => matchesPreset(date.from!, date.to!, preset));
    if (matchedPreset) return matchedPreset.label;

    return `${format(date.from, 'MMM d')} - ${format(date.to, 'MMM d, yyyy')}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal text-xs h-8 w-[180px]',
            !date?.from && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" sideOffset={4}>
        <div className="flex">
          <div className="border-r border-border p-1.5 space-y-0.5 min-w-[120px]">
            {datePresets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7 text-xs font-normal px-2"
                onClick={() => handlePresetSelect(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="p-2"
            classNames={{
              months: 'flex flex-col sm:flex-row gap-3',
              month: 'flex flex-col gap-3 min-w-[240px]',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-xs font-medium',
              nav: 'flex items-center gap-1',
              nav_button:
                'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input hover:bg-accent hover:text-accent-foreground rounded-md',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-muted-foreground rounded-md w-8 font-normal text-xs text-center',
              row: 'flex w-full mt-1.5',
              cell: 'relative p-0 text-center text-xs focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md',
              day: 'h-7 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md',
              day_selected:
                'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
              day_today: 'bg-accent text-accent-foreground',
              day_outside:
                'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
              day_disabled: 'text-muted-foreground opacity-50',
              day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
              day_hidden: 'invisible',
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
