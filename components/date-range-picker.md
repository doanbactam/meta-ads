# DateRangePicker Components

Hai component date range picker được tối ưu cho Ad Manager Dashboard.

## DateRangePicker (Full Featured)

Component đầy đủ tính năng với preset ranges và custom options.

### Features

- ✅ **Preset ranges**: Today, Yesterday, Last 7/14/30 days, This week/month
- ✅ **Extended presets**: Last 90 days, 6 months, 1 year
- ✅ **Dual calendar**: 2-month view cho dễ chọn
- ✅ **Smart formatting**: Tự động format ngắn gọn
- ✅ **Clear button**: X button để xóa selection
- ✅ **Keyboard support**: Full keyboard navigation
- ✅ **Disabled dates**: Không cho chọn ngày tương lai
- ✅ **Action buttons**: Clear, Cancel, Apply

### Usage

```tsx
import { DateRangePicker } from '@/components/date-range-picker';

function MyComponent() {
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  return (
    <DateRangePicker 
      value={dateRange} 
      onChange={setDateRange}
      placeholder="select date range"
      align="end"
      disabled={false}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `{from: Date \| undefined, to: Date \| undefined}` | - | Current selected range |
| `onChange` | `(range) => void` | - | Callback khi range thay đổi |
| `className` | `string` | - | Additional CSS classes |
| `placeholder` | `string` | `"pick date range"` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable component |
| `align` | `"start" \| "center" \| "end"` | `"end"` | Popover alignment |

## DateRangePickerCompact

Version gọn nhẹ cho sidebar hoặc toolbar.

### Features

- ✅ **Single calendar**: 1-month view
- ✅ **Compact formatting**: Format ngắn gọn hơn
- ✅ **Clear button**: X button để xóa
- ✅ **Auto width**: Tự động điều chỉnh width

### Usage

```tsx
import { DateRangePickerCompact } from '@/components/date-range-picker-compact';

function Toolbar() {
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  return (
    <DateRangePickerCompact 
      value={dateRange} 
      onChange={setDateRange}
      placeholder="dates"
    />
  );
}
```

## Preset Ranges

### Quick Select
- **today**: Hôm nay
- **yesterday**: Hôm qua  
- **last 7 days**: 7 ngày qua (bao gồm hôm nay)
- **last 14 days**: 14 ngày qua
- **last 30 days**: 30 ngày qua
- **this week**: Tuần này (Thứ 2 - Chủ nhật)
- **this month**: Tháng này

### Extended Ranges
- **last 90 days**: 90 ngày qua
- **last 6 months**: 6 tháng qua
- **last year**: 1 năm qua

## Formatting Logic

### Full DateRangePicker
```
Same month: "Dec 01 - 15, 2024"
Same year:  "Dec 01 - Jan 15, 2024" 
Diff year:  "Dec 01, 2023 - Jan 15, 2024"
```

### Compact DateRangePicker
```
Same month: "Dec 01 - 15"
Same year:  "Dec 01 - Jan 15"
Diff year:  "Dec 01, 23 - Jan 15, 24"
```

## Styling

Follows project UI patterns:
- **Height**: `h-8` (32px) matching other inputs
- **Text size**: `text-xs` (12px)
- **Border**: `border-border` with hover states
- **Colors**: Uses semantic color tokens
- **Icons**: `h-3.5 w-3.5` (14px) Lucide icons

## Integration Examples

### Dashboard Overview
```tsx
<div className="flex items-center justify-between">
  <h1>dashboard</h1>
  <DateRangePicker value={dateRange} onChange={setDateRange} />
</div>
```

### Campaign Table
```tsx
<div className="flex items-center justify-between">
  <SearchInput />
  <DateRangePicker value={dateRange} onChange={setDateRange} />
</div>
```

### Sidebar Filter
```tsx
<div className="space-y-2">
  <label>date range</label>
  <DateRangePickerCompact value={dateRange} onChange={setDateRange} />
</div>
```

## Performance

- ✅ **Memoized formatting**: Tránh re-render không cần thiết
- ✅ **Lazy calendar**: Calendar chỉ render khi mở
- ✅ **Optimized presets**: Preset ranges được cache
- ✅ **Event delegation**: Efficient event handling

## Accessibility

- ✅ **Keyboard navigation**: Tab, Enter, Escape, Arrow keys
- ✅ **Screen reader**: Proper ARIA labels
- ✅ **Focus management**: Focus trapping trong popover
- ✅ **High contrast**: Works với high contrast mode