# Folder Structure Modernization (2025)

## Overview

This document describes the comprehensive folder structure modernization completed for the Next.js 15 Facebook Ads Management Dashboard. This migration brings the codebase up to 2025 standards with improved organization, scalability, and developer experience.

## Rationale

### Why the Change?

The previous flat structure had several limitations:

1. **Config Files Mixed with Code** - Root directory cluttered with both configuration and application code
2. **Flat `lib/` Directory** - No clear separation between server-only, client-only, and shared code
3. **No Server Actions Folder** - Server Actions scattered throughout the codebase
4. **Non-standard Documentation** - `.kiro/` folder instead of standard `docs/`
5. **No Test Infrastructure** - Missing dedicated testing setup
6. **Poor Scalability** - Flat structure doesn't scale well for growing applications

### Benefits of New Structure

- ✅ **Clear Code/Config Separation** - All application code in `src/`, config files at root
- ✅ **Runtime Boundary Enforcement** - Server/client/shared code clearly separated
- ✅ **Better Route Organization** - Route groups for logical feature grouping
- ✅ **Improved Discoverability** - Collocated code with private folders
- ✅ **Standard Documentation** - Standard `docs/` folder structure
- ✅ **Test Infrastructure** - Dedicated testing setup with Vitest
- ✅ **Future-Proof** - Follows Next.js 15 best practices and 2025 standards

## Migration Summary

### Before (Flat Structure)

```
├── app/                    # Mixed routes
│   ├── campaigns/
│   ├── ad-sets/
│   ├── ads/
│   ├── dashboard/
│   ├── sign-in/
│   ├── sign-up/
│   └── api/
├── lib/                    # Cluttered utilities
│   ├── api/
│   ├── contexts/
│   ├── providers/
│   ├── stores/
│   └── validations/
├── components/
├── hooks/
├── types/
├── prisma/
├── scripts/
├── backup/                 # Legacy code
├── .kiro/                  # Non-standard docs
├── middleware.ts
├── tsconfig.json
├── next.config.js
└── package.json
```

### After (Modern `src/` Structure)

```
├── src/                    # All application code
│   ├── app/
│   │   ├── (dashboard)/    # Route group for dashboard
│   │   │   ├── layout.tsx  # Shared dashboard layout
│   │   │   ├── campaigns/
│   │   │   ├── ad-sets/
│   │   │   ├── ads/
│   │   │   ├── analytics/
│   │   │   ├── dashboard/
│   │   │   └── support/
│   │   ├── (auth)/         # Route group for auth
│   │   │   ├── sign-in/
│   │   │   ├── sign-up/
│   │   │   └── facebook-callback/
│   │   ├── api/
│   │   │   └── _lib/       # API-specific utilities
│   │   │       ├── utils.ts
│   │   │       └── rate-limiter.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── actions/            # Server Actions
│   │   ├── campaigns.ts
│   │   ├── ad-sets.ts
│   │   ├── ads.ts
│   │   └── user.ts
│   ├── components/
│   │   ├── _features/      # Feature-specific components
│   │   │   ├── campaigns/
│   │   │   ├── ad-sets/
│   │   │   ├── ads/
│   │   │   ├── dashboard/
│   │   │   └── ad-accounts/
│   │   ├── ui/             # shadcn/ui components
│   │   └── ...             # Shared components
│   ├── lib/
│   │   ├── server/         # Server-only code
│   │   │   ├── api/
│   │   │   │   ├── campaigns.ts
│   │   │   │   ├── ad-groups.ts
│   │   │   │   ├── creatives.ts
│   │   │   │   ├── ad-accounts.ts
│   │   │   │   └── users.ts
│   │   │   ├── prisma.ts
│   │   │   ├── facebook-api.ts
│   │   │   └── background-sync.ts
│   │   ├── shared/         # Isomorphic code
│   │   │   ├── validations/
│   │   │   │   └── schemas.ts
│   │   │   ├── utils.ts
│   │   │   ├── formatters.ts
│   │   │   └── currency.ts
│   │   └── client/         # Client-only code
│   │       ├── contexts/
│   │       │   └── user-settings-context.tsx
│   │       ├── providers/
│   │       │   └── query-provider.tsx
│   │       ├── stores/
│   │       │   └── facebook-store.ts
│   │       ├── data-persistence.ts
│   │       └── table-configs.tsx
│   ├── hooks/
│   ├── types/
│   ├── prisma/
│   ├── scripts/
│   ├── __tests__/          # Test infrastructure
│   │   └── setup.ts
│   ├── middleware.ts
│   └── instrumentation.ts  # Next.js 15 instrumentation
├── docs/                   # Standard documentation
│   ├── architecture/
│   │   ├── folder-structure.md
│   │   ├── tech-stack.md
│   │   ├── naming-conventions.md
│   │   ├── ui-patterns.md
│   │   ├── theming.md
│   │   ├── shadcn-comparison.md
│   │   ├── server-actions.md
│   │   └── testing.md
│   ├── migrations/
│   │   ├── nextjs15-migration.md
│   │   ├── universal-table-migration.md
│   │   └── folder-structure-2025.md
│   ├── integrations/
│   │   └── facebook.md
│   ├── product.md
│   ├── contributing.md
│   └── getting-started.md
├── archive/                # Legacy code
│   ├── backup-old-tables/
│   └── MIGRATION_COMPLETE.md
├── vitest.config.ts        # Test configuration
├── tsconfig.json           # Updated paths
├── next.config.js
├── package.json            # Updated scripts
├── components.json         # Updated paths
└── README.md               # Updated docs
```

## Key Changes

### 1. Introduced `src/` Folder

All application code now lives in `src/`, separating it from configuration files at the root. This is a Next.js best practice that improves project organization.

**Path Alias Update:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]  // Changed from "./*"
    }
  }
}
```

### 2. Route Groups

Introduced route groups `(dashboard)` and `(auth)` for logical organization without affecting URLs.

**Dashboard Layout:**
```tsx
// src/app/(dashboard)/layout.tsx
import { AppLayout } from '@/components/app-layout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
```

**Benefits:**
- Shared layouts for related routes
- Logical grouping without URL nesting
- Better code organization

### 3. Private Folders

Used `_lib` and `_features` prefixes to indicate non-routable organizational folders:

- `src/app/api/_lib` - API-specific utilities
- `src/components/_features` - Feature-specific components

### 4. Server Actions (`src/actions/`)

Created dedicated folder for Server Actions with proper validation and error handling:

```typescript
// src/actions/campaigns.ts
'use server';

export async function duplicateCampaignAction(input) {
  // Validate with Zod
  // Authenticate with Clerk
  // Execute with Prisma
  // Revalidate cache
  // Return typed result
}
```

### 5. Restructured `lib/`

Organized into three clear categories:

**Server (`src/lib/server/`):**
- Never imported by client components
- Prisma client, Facebook API, background sync
- Server-side API functions

**Shared (`src/lib/shared/`):**
- Isomorphic utilities
- Formatters, utilities, currency helpers
- Zod validation schemas

**Client (`src/lib/client/`):**
- Client-only code
- React contexts, providers, stores
- Browser-specific utilities

### 6. Documentation Migration

Moved from non-standard `.kiro/` to standard `docs/` folder with logical subdirectories:

- `docs/architecture/` - Technical documentation
- `docs/migrations/` - Migration guides
- `docs/integrations/` - Integration docs
- `docs/` - General documentation

### 7. Test Infrastructure

Added comprehensive testing setup with Vitest:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

### 8. Instrumentation

Added `src/instrumentation.ts` for Next.js 15 observability:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Environment validation
    // Logging initialization
    // Telemetry setup
  }
}
```

## Post-Migration Checklist

Use this checklist to verify your imports after the migration:

### Configuration Files

- [ ] `tsconfig.json` - Paths point to `./src/*`
- [ ] `package.json` - Prisma seed path updated to `src/prisma/seed.ts`
- [ ] `components.json` - Utils point to `@/lib/shared/utils`
- [ ] `next.config.js` - Compatible with src/ structure

### Import Paths

- [ ] All `@/lib/prisma` → `@/lib/server/prisma`
- [ ] All `@/lib/facebook-api` → `@/lib/server/facebook-api`
- [ ] All `@/lib/utils` → `@/lib/shared/utils`
- [ ] All `@/lib/formatters` → `@/lib/shared/formatters`
- [ ] All `@/lib/validations/schemas` → `@/lib/shared/validations/schemas`
- [ ] All `@/lib/contexts/*` → `@/lib/client/contexts/*`
- [ ] All `@/lib/providers/*` → `@/lib/client/providers/*`
- [ ] All `@/lib/stores/*` → `@/lib/client/stores/*`
- [ ] All `@/lib/api/*` → `@/lib/server/api/*`

### Server Actions

- [ ] Campaigns use `@/actions/campaigns`
- [ ] Ad sets use `@/actions/ad-sets`
- [ ] Ads use `@/actions/ads`
- [ ] User settings use `@/actions/user`

### Routes

- [ ] Dashboard routes accessible at same URLs
- [ ] Auth routes accessible at same URLs
- [ ] API routes unchanged

### Tests

- [ ] Run `bun test` to verify tests work
- [ ] Check test coverage
- [ ] Verify mocks work correctly

### Build

- [ ] Run `bun run build` to verify production build
- [ ] Check for TypeScript errors
- [ ] Verify no broken imports

## Common Migration Issues

### Issue: Import not found

**Problem:** `Cannot find module '@/lib/utils'`

**Solution:** Update import to `@/lib/shared/utils`

### Issue: Server-only code in client component

**Problem:** `Module not found: Can't resolve '@/lib/server/prisma'`

**Solution:** Server code should only be imported in Server Components or Server Actions

### Issue: Path alias not resolving

**Problem:** VS Code shows error on `@/*` imports

**Solution:** Restart TypeScript server (`Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server")

### Issue: Build fails with module errors

**Problem:** `Module not found` errors during build

**Solution:** Run `bun install` to ensure dependencies are installed, then check tsconfig.json paths

## Best Practices Going Forward

1. **Server/Client Separation**
   - Keep server code in `src/lib/server/`
   - Keep client code in `src/lib/client/`
   - Keep shared code in `src/lib/shared/`

2. **Server Actions**
   - Create new Server Actions in `src/actions/`
   - Always use `'use server'` directive
   - Validate inputs with Zod
   - Handle authentication with Clerk
   - Return typed responses

3. **Private Folders**
   - Use `_` prefix for organizational folders
   - Collocate feature-specific code

4. **Route Groups**
   - Group related routes logically
   - Share layouts within groups
   - Don't affect URLs

5. **Testing**
   - Write tests alongside code or in `__tests__/`
   - Use setup file for common mocks
   - Run tests before committing

## Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Next.js Project Organization](https://nextjs.org/docs/app/building-your-application/routing/colocation)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)

## Conclusion

This modernization brings the codebase up to 2025 standards with improved organization, better developer experience, and a foundation for future growth. The clear separation of concerns, modern folder structure, and comprehensive testing infrastructure will help the team maintain and scale the application effectively.
