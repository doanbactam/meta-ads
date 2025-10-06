'use client';

import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/shared/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FacebookDateRangePickerProps {
  value: { from: Date | undefined; to: Date | undefined };
  onChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onChangeStrings?: (range: { from: string; to: string }) => void;
  className?: string;
  disabled?: boolean;
}

// Facebook-compliant date presets
// https://developers.facebook.com/docs/marketing-api/insights/parameters/v23.0
const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last_3d', label: 'Last 3 Days' },
  { value: 'last_7d', label: 'Last 7 Days' },
  { value: 'last_14d', label: 'Last 14 Days' },
  { value: 'last_30d', label: 'Last 30 Days' },
  { value: 'last_90d', label: 'Last 90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'lifetime', label: 'Lifetime' },
  { value: 'custom', label: 'Custom Range' },
] as const;

type DatePreset = typeof DATE_PRESETS[number]['value'];

// Convert preset to actual date range
function presetToDateRange(preset: DatePreset): { from: Date; to: Date } | null {
  const now = new Date();
  const today = startOfDay(now);

  switch (preset) {
    case 'today':
      return { from: today, to: endOfDay(now) };
    case 'yesterday':
      return { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) };
    case 'last_3d':
      return { from: startOfDay(subDays(now, 2)), to: endOfDay(now) };
    case 'last_7d':
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case 'last_14d':
      return { from: startOfDay(subDays(now, 13)), to: endOfDay(now) };
    case 'last_30d':
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case 'last_90d':
      return { from: startOfDay(subDays(now, 89)), to: endOfDay(now) };
    case 'this_month':
      return { from: startOfMonth(now), to: endOfDay(now) };
    case 'last_month':
      const lastMonth = subMonths(now, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    case 'this_quarter':
      const quarterStart = startOfMonth(new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1));
      return { from: quarterStart, to: endOfDay(now) };
    case 'last_3_months':
      return { from: startOfDay(subMonths(now, 3)), to: endOfDay(now) };
    case 'lifetime':
      // Facebook allows maximum 37 months for lifetime
      return { from: startOfDay(subMonths(now, 37)), to: endOfDay(now) };
    case 'custom':
      return null;
    default:
      return null;
  }
}

// Detect which preset matches current date range
function detectPreset(from: Date | undefined, to: Date | undefined): DatePreset {
  if (!from || !to) return 'custom';

  const fromStr = format(from, 'yyyy-MM-dd');
  const toStr = format(to, 'yyyy-MM-dd');

  for (const preset of DATE_PRESETS) {
    if (preset.value === 'custom') continue;
    const range = presetToDateRange(preset.value);
    if (range && format(range.from, 'yyyy-MM-dd') === fromStr && format(range.to, 'yyyy-MM-dd') === toStr) {
      return preset.value;
    }
  }

  return 'custom';
}

export function FacebookDateRangePicker({
  value,
  onChange,
  onChangeStrings,
  className,
  disabled = false,
}: FacebookDateRangePickerProps) {
  const [preset, setPreset] = React.useState<DatePreset>(() => detectPreset(value.from, value.to));
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [customDate, setCustomDate] = React.useState<DateRange | undefined>({
    from: value.from,
    to: value.to,
  });

  // Sync with external value changes
  React.useEffect(() => {
    const detectedPreset = detectPreset(value.from, value.to);
    setPreset(detectedPreset);
    setCustomDate({ from: value.from, to: value.to });
  }, [value.from, value.to]);

  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);

    if (newPreset === 'custom') {
      setIsCalendarOpen(true);
      return;
    }

    const range = presetToDateRange(newPreset);
    if (range) {
      onChange(range);
    }
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    setCustomDate(range);
    if (range?.from && range?.to) {
      const fromDate = startOfDay(range.from);
      const toDate = endOfDay(range.to);
      
      onChange({ from: fromDate, to: toDate });
      
      // Also call string callback if provided
      onChangeStrings?.({
        from: format(fromDate, 'yyyy-MM-dd'),
        to: format(toDate, 'yyyy-MM-dd'),
      });
      
      setPreset('custom');
      setIsCalendarOpen(false);
    }
  };

  const formatDateRange = () => {
    if (preset !== 'custom') {
      return DATE_PRESETS.find((p) => p.value === preset)?.label || 'Select';
    }

    if (!customDate?.from) return 'Custom Range';
    if (!customDate.to) return format(customDate.from, 'MMM dd, yyyy');
    
    const isSameMonth = customDate.from.getMonth() === customDate.to.getMonth() && 
                        customDate.from.getFullYear() === customDate.to.getFullYear();
    
    if (isSameMonth) {
      return `${format(customDate.from, 'MMM dd')} - ${format(customDate.to, 'dd, yyyy')}`;
    }
    
    return `${format(customDate.from, 'MMM dd')} - ${format(customDate.to, 'MMM dd, yyyy')}`;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Preset Selector */}
      <Select value={preset} onValueChange={handlePresetChange} disabled={disabled}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {DATE_PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value} className="text-xs">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom Date Range Picker */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'h-8 min-w-[200px] justify-start text-left font-normal text-xs',
              preset !== 'custom' && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={customDate?.from}
            selected={customDate}
            onSelect={handleCustomDateSelect}
            numberOfMonths={2}
            disabled={(date) => date > new Date() || date < subMonths(new Date(), 37)}
            className="rounded-md border"
          />
          <div className="border-t p-3">
            <p className="text-xs text-muted-foreground">
              Facebook allows maximum 37 months of historical data
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
