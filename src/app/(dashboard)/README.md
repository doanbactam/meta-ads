# Dashboard Pages

Protected dashboard routes cho authenticated users.

## Cấu trúc

```
(dashboard)/
├── campaigns/             # Campaign management
│   └── page.tsx
├── dashboard/             # Main dashboard
│   └── page.tsx
├── demo/                  # Demo page
│   └── page.tsx
└── layout.tsx            # Dashboard layout
```

## Pages

### Main Dashboard (`/dashboard`)

Trang chính hiển thị overview của ad account:

**Features:**
- Ad account selection
- Overview statistics
- Performance charts
- Top campaigns
- Quick actions
- Alerts and notifications

**Components:**
- `DashboardOverview` - Main container
- `AdAccountStats` - Statistics cards
- `DashboardCharts` - Performance charts
- `TopCampaigns` - Top performing campaigns
- `QuickActions` - Quick action buttons
- `DashboardAlerts` - Alert notifications

**Data Sources:**
- `/api/ad-accounts/[id]/overview` - Overview data
- `/api/ad-accounts/[id]/stats` - Statistics
- `/api/ad-accounts/[id]/daily-stats` - Chart data
- `/api/ad-accounts/[id]/top-campaigns` - Top campaigns

### Campaigns (`/campaigns`)

Trang quản lý campaigns với universal data table:

**Features:**
- Campaign list with filtering
- Create/edit/delete campaigns
- Duplicate campaigns
- Bulk actions
- AI analysis
- Column customization
- Export data

**Components:**
- `UniversalDataTable` - Main table
- `FacebookDateRangePicker` - Date range filter
- `ColumnsSelector` - Column visibility
- `TablePagination` - Pagination controls

**Data Sources:**
- `/api/campaigns` - Campaign list
- `/api/campaigns/[id]` - Single campaign
- `/api/campaigns/[id]/duplicate` - Duplicate
- `/api/ai/analyze` - AI analysis

**Tabs:**
- Campaigns - All campaigns
- Ad Sets - All ad sets
- Ads - All ads

### Demo (`/demo`)

Demo page để test features với mock data:

**Features:**
- Seed demo data
- Clear demo data
- Test CRUD operations
- Test table features

**Components:**
- Demo form
- Action buttons
- Data display

**Data Sources:**
- `/api/demo/data` - Get demo data
- `/api/demo/seed` - Seed data
- `/api/demo/clear` - Clear data

## Layout

Dashboard layout (`layout.tsx`) provides:

**Features:**
- Sidebar navigation
- Header with user menu
- Mobile responsive
- Theme toggle
- Ad account selector

**Components:**
- `AppLayout` - Main layout wrapper
- `Sidebar` - Desktop navigation
- `MobileSidebar` - Mobile navigation
- `Header` - Top bar

## Navigation

### Sidebar Links

```tsx
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/campaigns', icon: Target },
  { name: 'Settings', href: '/settings', icon: Settings },
];
```

### Breadcrumbs

Automatically generated based on route:

```
Dashboard > Campaigns > Campaign Name
```

## Authentication

Tất cả dashboard pages yêu cầu authentication:

```tsx
// middleware.ts
export default clerkMiddleware((auth, req) => {
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    auth().protect();
  }
});
```

## Data Fetching

### Server Components (Recommended)

```tsx
// app/(dashboard)/dashboard/page.tsx
export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await getUser(userId);
  
  return <DashboardOverview user={user} />;
}
```

### Client Components with React Query

```tsx
'use client';

export function CampaignList({ adAccountId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', adAccountId],
    queryFn: () => fetch(`/api/campaigns?adAccountId=${adAccountId}`).then(r => r.json()),
  });

  if (isLoading) return <Skeleton />;
  return <Table data={data} />;
}
```

## State Management

### URL State (Preferred)

```tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export function Filters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const status = searchParams.get('status');
  
  const setStatus = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', value);
    router.push(`?${params.toString()}`);
  };
  
  return <Select value={status} onChange={setStatus} />;
}
```

### Context (For Shared State)

```tsx
// contexts/ad-account-context.tsx
'use client';

const AdAccountContext = createContext<AdAccountContextType | null>(null);

export function AdAccountProvider({ children }: Props) {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  
  return (
    <AdAccountContext.Provider value={{ selectedAccount, setSelectedAccount }}>
      {children}
    </AdAccountContext.Provider>
  );
}

export function useAdAccount() {
  const context = useContext(AdAccountContext);
  if (!context) throw new Error('useAdAccount must be used within AdAccountProvider');
  return context;
}
```

### Zustand (For Complex State)

```tsx
// stores/facebook-store.ts
import { create } from 'zustand';

interface FacebookStore {
  isConnected: boolean;
  adAccounts: AdAccount[];
  setConnected: (connected: boolean) => void;
  setAdAccounts: (accounts: AdAccount[]) => void;
}

export const useFacebookStore = create<FacebookStore>((set) => ({
  isConnected: false,
  adAccounts: [],
  setConnected: (connected) => set({ isConnected: connected }),
  setAdAccounts: (accounts) => set({ adAccounts: accounts }),
}));
```

## Performance Optimization

### 1. Server Components

Use Server Components by default:

```tsx
// ✅ Good: Server Component
export default async function Page() {
  const data = await fetchData();
  return <Display data={data} />;
}

// ❌ Bad: Client Component for static content
'use client';
export default function Page() {
  const [data, setData] = useState();
  useEffect(() => { fetchData().then(setData); }, []);
  return <Display data={data} />;
}
```

### 2. Streaming

Use Suspense for streaming:

```tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}
```

### 3. Parallel Data Fetching

```tsx
export default async function Page() {
  // Fetch in parallel
  const [user, campaigns, stats] = await Promise.all([
    getUser(),
    getCampaigns(),
    getStats(),
  ]);
  
  return <Dashboard user={user} campaigns={campaigns} stats={stats} />;
}
```

### 4. Caching

```tsx
// Cache for 1 hour
export const revalidate = 3600;

export default async function Page() {
  const data = await fetchData();
  return <Display data={data} />;
}
```

## Error Handling

### Error Boundaries

```tsx
// app/(dashboard)/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Not Found

```tsx
// app/(dashboard)/campaigns/[id]/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>Campaign Not Found</h2>
      <Link href="/campaigns">Back to campaigns</Link>
    </div>
  );
}
```

## Loading States

```tsx
// app/(dashboard)/campaigns/loading.tsx
export default function Loading() {
  return <Skeleton />;
}
```

## Metadata

```tsx
// app/(dashboard)/campaigns/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campaigns | Ad Manager',
  description: 'Manage your advertising campaigns',
};

export default function Page() {
  return <CampaignsPage />;
}
```

## Best Practices

### 1. File Organization

```
page/
├── page.tsx              # Main page component
├── loading.tsx           # Loading state
├── error.tsx             # Error boundary
├── not-found.tsx         # 404 page
└── components/           # Page-specific components
    ├── header.tsx
    └── content.tsx
```

### 2. Component Composition

```tsx
// ✅ Good: Composable
<DashboardLayout>
  <DashboardHeader />
  <DashboardContent>
    <Stats />
    <Charts />
  </DashboardContent>
</DashboardLayout>

// ❌ Bad: Monolithic
<Dashboard
  showHeader
  showStats
  showCharts
  statsData={...}
  chartsData={...}
/>
```

### 3. Type Safety

```tsx
interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  // Type-safe params and search params
}
```

### 4. Accessibility

```tsx
// Good: Semantic HTML
<main>
  <h1>Dashboard</h1>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/campaigns">Campaigns</a></li>
    </ul>
  </nav>
</main>

// Good: ARIA labels
<button aria-label="Close dialog" onClick={onClose}>
  <X />
</button>
```

## Testing

### Page Tests

```tsx
import { render, screen } from '@testing-library/react';
import Page from './page';

test('renders dashboard', async () => {
  render(await Page());
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
```

### Integration Tests

```tsx
test('navigates to campaigns', async () => {
  render(<App />);
  
  await userEvent.click(screen.getByText('Campaigns'));
  
  expect(screen.getByRole('heading', { name: 'Campaigns' })).toBeInTheDocument();
});
```

## Related Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Clerk Authentication](https://clerk.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
