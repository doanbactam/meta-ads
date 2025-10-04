'use client';

import { useState } from 'react';
import { DateRangePicker } from '@/components/date-range-picker';
import { DateRangePickerCompact } from '@/components/date-range-picker-compact';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DateRangePickerDemo() {
  const [dateRange1, setDateRange1] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  const [dateRange2, setDateRange2] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">date range picker demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Full featured version */}
          <div className="space-y-2">
            <label className="text-sm font-medium">full featured picker</label>
            <DateRangePicker 
              value={dateRange1} 
              onChange={setDateRange1}
              placeholder="select campaign dates"
            />
            <div className="text-xs text-muted-foreground">
              Selected: {dateRange1.from ? dateRange1.from.toDateString() : 'None'} - {dateRange1.to ? dateRange1.to.toDateString() : 'None'}
            </div>
          </div>

          {/* Compact version */}
          <div className="space-y-2">
            <label className="text-sm font-medium">compact picker</label>
            <DateRangePickerCompact 
              value={dateRange2} 
              onChange={setDateRange2}
              placeholder="quick select"
            />
            <div className="text-xs text-muted-foreground">
              Selected: {dateRange2.from ? dateRange2.from.toDateString() : 'None'} - {dateRange2.to ? dateRange2.to.toDateString() : 'None'}
            </div>
          </div>

          {/* Different alignments */}
          <div className="space-y-4">
            <label className="text-sm font-medium">alignment options</label>
            <div className="flex gap-4 items-center">
              <DateRangePicker 
                value={dateRange1} 
                onChange={setDateRange1}
                align="start"
                placeholder="align start"
              />
              <DateRangePicker 
                value={dateRange1} 
                onChange={setDateRange1}
                align="center"
                placeholder="align center"
              />
              <DateRangePicker 
                value={dateRange1} 
                onChange={setDateRange1}
                align="end"
                placeholder="align end"
              />
            </div>
          </div>

          {/* Disabled state */}
          <div className="space-y-2">
            <label className="text-sm font-medium">disabled state</label>
            <DateRangePicker 
              value={dateRange1} 
              onChange={setDateRange1}
              disabled={true}
              placeholder="disabled picker"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}