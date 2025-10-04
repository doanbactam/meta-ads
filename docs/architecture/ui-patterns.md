---
inclusion: always
---

# UI Patterns & Best Practices

Quick reference for building consistent UI components in this project.

## Component Sizing Standards

### Buttons
```tsx
// Standard button
<Button size="sm" className="h-8 gap-1.5 px-3 text-xs">
  <Icon className="h-3.5 w-3.5" />
  label
</Button>

// Icon-only button
<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
  <Icon className="h-3.5 w-3.5" />
</Button>
```

### Inputs
```tsx
// Search input
<Input 
  placeholder="search..." 
  className="h-8 pl-8 text-xs" 
/>

// Number input (pagination)
<Input 
  type="number" 
  className="h-7 w-14 text-xs" 
  defaultValue="1" 
/>
```

### Select Dropdowns
```tsx
// Small select (h-8)
<Select defaultValue="6">
  <SelectTrigger size="sm" className="w-14 text-xs">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="6">6</SelectItem>
    <SelectItem value="10">10</SelectItem>
  </SelectContent>
</Select>

// Default select (h-9)
<Select defaultValue="option1">
  <SelectTrigger className="w-48">
    <SelectValue placeholder="select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

## Table Patterns

### Table Container
```tsx
<div className="rounded-sm border border-border overflow-x-auto">
  <table className="w-full text-xs min-w-[800px]">
    {/* ... */}
  </table>
</div>
```

### Table Header
```tsx
<thead className="bg-muted/50 border-b border-border">
  <tr>
    <th className="w-10 p-2">
      <Checkbox />
    </th>
    <th className="text-left p-2 font-medium">name</th>
  </tr>
</thead>
```

### Table Body
```tsx
<tbody>
  {items.map((item) => (
    <tr 
      key={item.id}
      className="border-b border-border hover:bg-muted/30 transition-colors"
    >
      <td className="p-2">
        <Checkbox />
      </td>
      <td className="p-2 font-medium">{item.name}</td>
    </tr>
  ))}
</tbody>
```

## Status Indicators

### Status Dot
```tsx
<span className="flex items-center gap-1.5 text-foreground">
  <span className="h-1 w-1 rounded-full bg-current"></span>
  {status.toLowerCase()}
</span>
```

### Status Colors
```tsx
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
    case 'Eligible':
      return 'text-foreground';
    case 'Rejected':
    case 'Error':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
};
```

## Badge/Tag Patterns

```tsx
// Format badge
<span className="text-xs px-2 py-0.5 rounded-sm bg-primary/10 text-primary">
  {format.toLowerCase()}
</span>

// Status badge
<span className="text-xs px-2 py-0.5 rounded-sm bg-muted text-muted-foreground">
  {status}
</span>
```

## Layout Patterns

### Page Container
```tsx
<div className="space-y-3">
  {/* Search bar */}
  {/* Action buttons */}
  {/* Content */}
  {/* Pagination */}
</div>
```

### Search Bar Row
```tsx
<div className="flex items-center justify-between">
  <div className="relative w-64">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
    <Input placeholder="search..." className="h-8 pl-8 text-xs" />
  </div>
  <DateRangePicker value={dateRange} onChange={setDateRange} />
</div>
```

### Action Buttons Row
```tsx
<div className="flex items-center justify-between">
  <div className="flex gap-1.5">
    <Button size="sm" className="h-8 gap-1.5 px-3 text-xs">
      <Plus className="h-3.5 w-3.5" />
      new
    </Button>
    <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs">
      <Edit className="h-3.5 w-3.5" />
      edit
    </Button>
  </div>
  <div className="flex gap-1.5">
    <ColumnsSelector />
    <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3 text-xs">
      <BarChart3 className="h-3.5 w-3.5" />
      breakdown
    </Button>
  </div>
</div>
```

### Pagination Row
```tsx
<div className="flex items-center justify-between text-xs">
  <div className="text-muted-foreground">total: {count}</div>
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      <span className="text-muted-foreground">1 / 10</span>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">rows:</span>
      <Select defaultValue="6">
        <SelectTrigger size="sm" className="w-14 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="6">6</SelectItem>
          <SelectItem value="10">10</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</div>
```

## Spacing Standards

- **Component spacing**: `space-y-3` for main containers
- **Button groups**: `gap-1.5`
- **Icon + text**: `gap-1.5`
- **Pagination sections**: `gap-3`
- **Table cells**: `p-2`
- **Form fields**: `space-y-2`

## Icon Sizing

- **Small icons** (buttons, table): `h-3.5 w-3.5`
- **Medium icons** (headers): `h-4 w-4`
- **Large icons** (empty states): `h-8 w-8`

## Text Sizing

- **Table text**: `text-xs`
- **Button text**: `text-xs`
- **Body text**: `text-sm`
- **Headers**: `text-sm font-medium`
- **Large headers**: `text-base font-semibold`

## Border Radius

- **Small**: `rounded-sm` (tables, badges)
- **Medium**: `rounded-md` (cards, dialogs)
- **Large**: `rounded-lg` (modals)

## Opacity Modifiers

- **Hover backgrounds**: `hover:bg-muted/30`
- **Disabled states**: `opacity-50`
- **Overlay backgrounds**: `bg-muted/50`
- **Badge backgrounds**: `bg-primary/10`

## Date Range Picker

### Basic Usage
```tsx
const [dateRange, setDateRange] = useState<{
  from: Date | undefined;
  to: Date | undefined;
}>({
  from: undefined,
  to: undefined,
});

<DateRangePicker value={dateRange} onChange={setDateRange} />
```

### Features
- Compact size (h-8) matching other inputs
- Two-month calendar view
- Theme-aware styling
- Proper date formatting (MMM dd, yyyy)
- Syncs with external state

## Common Patterns

### Loading State
```tsx
{isLoading ? (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
) : (
  <Content />
)}
```

### Empty State
```tsx
{items.length === 0 ? (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <Icon className="h-8 w-8 text-muted-foreground mb-2" />
    <p className="text-sm text-muted-foreground">no items found</p>
  </div>
) : (
  <Table />
)}
```

### Error State
```tsx
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
)}
```

## Accessibility

Always include:
- `aria-label` for icon-only buttons
- `title` for tooltips on hover
- Proper semantic HTML (`<button>`, `<table>`, etc.)
- Keyboard navigation support
- Focus states (handled by shadcn/ui)

## Performance

- Use `React.memo` for expensive table rows
- Debounce search inputs (300ms)
- Virtualize tables with >100 rows
- Lazy load images and heavy components
- Use `useCallback` for event handlers in lists
