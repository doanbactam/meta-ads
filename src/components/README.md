# Components

React components được tổ chức theo chức năng và mục đích sử dụng.

## Cấu trúc

```
components/
├── ui/                    # shadcn/ui base components
├── layout/                # Layout components
├── dashboard/             # Dashboard-specific components
├── ad-manager/            # Ad management components
├── facebook/              # Facebook integration components
├── table/                 # Universal table system
├── ai/                    # AI components
└── common/                # Common/shared components
```

## UI Components (`ui/`)

Base components từ shadcn/ui với customization:

- `alert.tsx` - Alert messages
- `badge.tsx` - Badge component
- `button.tsx` - Button variants
- `calendar.tsx` - Date picker calendar
- `card.tsx` - Card container
- `checkbox.tsx` - Checkbox input
- `dialog.tsx` - Modal dialog
- `input.tsx` - Text input
- `label.tsx` - Form label
- `popover.tsx` - Popover menu
- `select.tsx` - Select dropdown
- `separator.tsx` - Visual separator
- `sheet.tsx` - Side sheet/drawer
- `table.tsx` - Base table
- `tabs.tsx` - Tab navigation
- `toast.tsx` - Toast notifications
- `tooltip.tsx` - Tooltip

### Usage

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button>Click me</Button>
  </CardContent>
</Card>
```

## Layout Components (`layout/`)

Components cho app layout structure:

- `app-layout.tsx` - Main app layout wrapper
- `header.tsx` - Top navigation header
- `sidebar.tsx` - Desktop sidebar navigation
- `mobile-sidebar.tsx` - Mobile sidebar drawer

### Usage

```tsx
import { AppLayout } from '@/components/layout';

export default function Page() {
  return (
    <AppLayout>
      {/* Page content */}
    </AppLayout>
  );
}
```

## Dashboard Components (`dashboard/`)

Components cho dashboard pages:

- `ad-account-info.tsx` - Ad account information card
- `ad-account-stats.tsx` - Statistics overview
- `ad-account-status.tsx` - Account status indicator
- `dashboard-alerts.tsx` - Alert notifications
- `dashboard-charts.tsx` - Data visualization charts
- `dashboard-overview.tsx` - Main dashboard overview
- `quick-actions.tsx` - Quick action buttons
- `top-campaigns.tsx` - Top performing campaigns list

### Usage

```tsx
import { DashboardOverview, AdAccountStats } from '@/components/dashboard';

<DashboardOverview adAccountId={id}>
  <AdAccountStats data={stats} />
</DashboardOverview>
```

## Ad Manager Components (`ad-manager/`)

Components cho ad management:

- `ad-manager-dashboard.tsx` - Ad manager main dashboard

### Usage

```tsx
import { AdManagerDashboard } from '@/components/ad-manager/ad-manager-dashboard';

<AdManagerDashboard adAccountId={id} />
```

## Facebook Components (`facebook/`)

Components cho Facebook integration:

- `facebook-connect-dialog.tsx` - Facebook OAuth connection dialog
- `facebook-date-range-picker.tsx` - Date range picker for Facebook data

### Usage

```tsx
import { FacebookConnectDialog, FacebookDateRangePicker } from '@/components/facebook';

<FacebookConnectDialog open={isOpen} onOpenChange={setIsOpen} />
<FacebookDateRangePicker value={dateRange} onChange={setDateRange} />
```

## Table Components (`table/`)

Universal data table system:

- `universal-data-table/` - Main table component
  - `index.tsx` - Table wrapper
  - `table-header.tsx` - Table header
  - `table-body.tsx` - Table body with rows
  - `table-toolbar.tsx` - Toolbar with actions
  - `table-empty-state.tsx` - Empty state
  - `types.ts` - TypeScript types
- `columns-selector.tsx` - Column visibility selector
- `table-pagination.tsx` - Pagination controls

### Usage

```tsx
import { UniversalDataTable } from '@/components/table';
import { campaignTableConfig } from '@/lib/client/table-configs';

<UniversalDataTable
  config={campaignTableConfig}
  adAccountId={adAccountId}
/>
```

## AI Components (`ai/`)

Components cho AI features:

- `ai-analysis-dialog.tsx` - AI campaign analysis dialog

### Usage

```tsx
import { AIAnalysisDialog } from '@/components/ai/ai-analysis-dialog';

<AIAnalysisDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  result={analysisResult}
  campaignName={name}
/>
```

## Common Components (`common/`)

Shared/reusable components:

- `badges.tsx` - Status and format badges
  - `StatusBadge` - Campaign/ad status badge
  - `FormatBadge` - Ad format badge
- `smart-navigation.tsx` - Smart navigation with prefetch
- `theme-provider.tsx` - Theme provider wrapper
- `user-settings-info.tsx` - User settings display

### Usage

```tsx
import { StatusBadge, FormatBadge } from '@/components/common';

<StatusBadge status="ACTIVE" />
<FormatBadge format="video" />
```

## Component Patterns

### Server vs Client Components

```tsx
// Server Component (default)
export default function ServerComponent() {
  // Can fetch data directly
  const data = await fetchData();
  return <div>{data}</div>;
}

// Client Component (needs 'use client')
'use client';

export function ClientComponent() {
  const [state, setState] = useState();
  return <button onClick={() => setState(...)}>Click</button>;
}
```

### Component Composition

```tsx
// Good: Composable components
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>

// Bad: Monolithic component
<CardWithTitleAndContent title="Title" content="Content" />
```

### Props Pattern

```tsx
// Good: Explicit props
interface ButtonProps {
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  children: React.ReactNode;
}

// Good: Extend HTML attributes
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
```

## Styling

### Tailwind CSS

Sử dụng Tailwind utility classes:

```tsx
<div className="flex items-center gap-2 p-4 rounded-lg bg-background">
  <Button className="w-full">Full width button</Button>
</div>
```

### cn() Utility

Merge class names với conditional logic:

```tsx
import { cn } from '@/lib/shared/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className // Allow override
)} />
```

### CSS Variables

Sử dụng CSS variables cho theming:

```tsx
<div className="bg-primary text-primary-foreground">
  Primary colored
</div>
```

## Best Practices

### 1. Component Organization

- Một component per file
- Export named components
- Group related components trong folders
- Tạo index.ts cho easy imports

### 2. Type Safety

```tsx
// Good: Explicit types
interface Props {
  title: string;
  count: number;
}

export function Component({ title, count }: Props) {
  // ...
}

// Bad: Any types
export function Component({ title, count }: any) {
  // ...
}
```

### 3. Performance

```tsx
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }) => {
  // Heavy computation
  return <div>{processData(data)}</div>;
});

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return heavyComputation(data);
}, [data]);
```

### 4. Accessibility

```tsx
// Good: Accessible button
<button
  type="button"
  aria-label="Close dialog"
  onClick={onClose}
>
  <X className="h-4 w-4" />
</button>

// Good: Accessible form
<form onSubmit={handleSubmit}>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={!!error}
  />
</form>
```

### 5. Error Boundaries

```tsx
// Wrap components that might error
<ErrorBoundary fallback={<ErrorFallback />}>
  <ComponentThatMightError />
</ErrorBoundary>
```

## Testing

### Component Tests

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from './button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Integration Tests

```tsx
test('form submission', async () => {
  const onSubmit = jest.fn();
  render(<Form onSubmit={onSubmit} />);
  
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
  
  expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
});
```

## Related Documentation

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [React Documentation](https://react.dev/)
