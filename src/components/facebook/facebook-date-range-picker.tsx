'use client';

import * as React from 'react';
import { addDays, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
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

const datePresets: DatePreset[] = [
  {
    label: 'Today',
    value: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Yesterday',
    value: () => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    label: 'Last 7 days',
    value: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 14 days',
    value: () => ({
      from: startOfDay(subDays(new Date(), 13)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 30 days',
    value: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'This month',
    value: () => ({
      from: startOfMonth(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last month',
    value: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
];

export function FacebookDateRangePicker({
  value,
  onChange,
  className,
  disabled = false,
}: FacebookDateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: value.from,
    to: value.to,
  });
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setDate({
      from: value.from,
      to: value.to,
    });
  }, [value.from, value.to]);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      onChange({
        from: range.from,
        to: range.to,
      });
      setIsOpen(false);
    } else if (range?.from) {
      onChange({
        from: range.from,
        to: range.from,
      });
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

    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));

    if (
      date.from.getTime() === today.getTime() &&
      date.to.getTime() === endOfDay(new Date()).getTime()
    ) {
      return 'Today';
    }

    if (
      date.from.getTime() === yesterday.getTime() &&
      date.to.getTime() === endOfDay(yesterday).getTime()
    ) {
      return 'Yesterday';
    }

    if (
      date.from.getTime() === startOfDay(subDays(new Date(), 6)).getTime() &&
      date.to.getTime() === endOfDay(new Date()).getTime()
    ) {
      return 'Last 7 days';
    }

    if (
      date.from.getTime() === startOfDay(subDays(new Date(), 29)).getTime() &&
      date.to.getTime() === endOfDay(new Date()).getTime()
    ) {
      return 'Last 30 days';
    }

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
          {/* Preset sidebar */}
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

          {/* Calendar */}
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
              nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input hover:bg-accent hover:text-accent-foreground rounded-md',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-muted-foreground rounded-md w-8 font-normal text-xs text-center',
              row: 'flex w-full mt-1.5',
              cell: 'relative p-0 text-center text-xs focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md',
              day: 'h-7 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md',
              day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
              day_today: 'bg-accent text-accent-foreground',
              day_outside: 'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
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
