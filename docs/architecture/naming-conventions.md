---
inclusion: always
---

# Naming Conventions

This project follows consistent naming conventions across all components and code.

## Text Case Standards

### UI Text (lowercase snake_case style)
All user-facing text uses lowercase with underscores for developer aesthetic:

```tsx
// ✅ CORRECT
<TabsTrigger>campaigns</TabsTrigger>
<TabsTrigger>ad_sets</TabsTrigger>
<TabsTrigger>creatives</TabsTrigger>
<Button>new campaign</Button>
<span>cost_per_conv</span>

// ❌ WRONG
<TabsTrigger>Campaigns</TabsTrigger>
<TabsTrigger>Ad Sets</TabsTrigger>
<Button>New Campaign</Button>
```

### Code Identifiers

- **Files**: kebab-case
  - `ad-groups-table.tsx`
  - `campaign-table.tsx`
  - `use-facebook-connection.ts`

- **Components**: PascalCase
  - `AdGroupsTable`
  - `CampaignTable`
  - `FacebookConnectDialog`

- **Functions/Variables**: camelCase
  - `loadAdAccounts`
  - `selectedAdAccount`
  - `handleDelete`

- **Constants**: UPPER_SNAKE_CASE
  - `DEFAULT_COLUMNS`
  - `API_BASE_URL`

- **Types/Interfaces**: PascalCase
  - `Campaign`
  - `AdAccount`
  - `HeaderProps`

## Tab Values

Use kebab-case for tab values (URL-friendly):

```tsx
<Tabs defaultValue="campaigns">
  <TabsTrigger value="campaigns">campaigns</TabsTrigger>
  <TabsTrigger value="ad-sets">ad_sets</TabsTrigger>
  <TabsTrigger value="creatives">creatives</TabsTrigger>
</Tabs>
```

## Component Props

### Consistent Prop Names

- `adAccountId` - Always use this for ad account identifier
- `onToggle` - For toggle handlers
- `onChange` - For change handlers
- `isLoading` - For loading states (not `loading`)
- `isDisabled` - For disabled states (not `disabled`)

### Props Flow

All table components should accept `adAccountId`:

```tsx
interface TableProps {
  adAccountId?: string;
}

export function CampaignTable({ adAccountId }: TableProps) {
  // Use adAccountId in queries
  const { data } = useQuery({
    queryKey: ['campaigns', adAccountId],
    queryFn: async () => {
      if (!adAccountId) return [];
      // fetch data
    },
    enabled: !!adAccountId,
  });
}
```

## Query Keys

Use consistent query key patterns:

```tsx
// ✅ CORRECT
queryKey: ['campaigns', adAccountId]
queryKey: ['ad-sets', adAccountId]
queryKey: ['ads', adAccountId]

// ❌ WRONG
queryKey: ['campaigns']
queryKey: ['adSets', adAccountId]
```

## API Endpoints

Use kebab-case for multi-word endpoints:

```
/api/campaigns
/api/ad-sets
/api/ads
/api/ad-accounts
/api/facebook/campaigns
```

## Database Columns

Use snake_case (already defined in schema):

```prisma
model Campaign {
  ad_account_id String
  date_start    DateTime?
  date_end      DateTime?
  cost_per_conversion Float
}
```

## ESLint Disable Comments

When disabling exhaustive-deps, always add comment:

```tsx
useEffect(() => {
  loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [dependency]);
```

## Consistency Checklist

Before committing, verify:

- [ ] All UI text is lowercase
- [ ] Tab values use kebab-case
- [ ] Component names use PascalCase
- [ ] Props follow naming standards
- [ ] Query keys are consistent
- [ ] No hard-coded colors (use theme tokens)
- [ ] Loading states use `isLoading`
- [ ] All tables accept `adAccountId` prop
