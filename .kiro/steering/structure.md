# Project Structure & Architecture

## Directory Organization

### Root Level
```
├── src/                    # Main source code
├── e2e/                    # End-to-end tests (Playwright)
├── scripts/                # Build and maintenance scripts
├── prisma/migrations/      # Database migrations
├── components/             # Legacy component location (prefer src/components)
├── .kiro/                  # Kiro IDE configuration
└── .vscode/                # VS Code settings
```

### Source Code Structure (`src/`)

#### Core Application
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes (sign-in, sign-up)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes and endpoints
│   ├── globals.css        # Global styles and CSS variables
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Landing page
├── middleware.ts          # Clerk authentication middleware
└── instrumentation.ts     # Next.js instrumentation
```

#### Components Architecture
```
src/components/
├── ui/                    # shadcn/ui base components (Button, Input, etc.)
├── layout/                # Layout components (Header, Sidebar, etc.)
├── dashboard/             # Dashboard-specific components
├── ad-manager/            # Ad management components
├── facebook/              # Facebook integration components
├── table/                 # Universal table system
└── common/                # Shared/common components
```

#### Business Logic
```
src/
├── actions/               # Server actions (campaigns, ads, user management)
├── hooks/                 # Custom React hooks
├── lib/
│   ├── server/           # Server-only utilities and configurations
│   ├── client/           # Client-only utilities
│   └── shared/           # Isomorphic utilities (can run on both)
└── types/                # TypeScript type definitions
```

#### Database
```
src/prisma/
├── schema.prisma         # Database schema (custom location)
└── seed.ts              # Database seeding script
```

## Architecture Patterns

### Route Organization
- **Route Groups**: Use `(auth)` and `(dashboard)` for logical grouping
- **Protected Routes**: All dashboard routes require authentication via middleware
- **API Routes**: RESTful endpoints in `src/app/api/`

### Component Patterns
- **Server Components**: Default for data fetching and static content
- **Client Components**: Use `"use client"` directive for interactivity
- **shadcn/ui**: Base UI components with consistent styling
- **Compound Components**: Complex components broken into smaller, reusable parts

### Data Flow
- **Server Actions**: For mutations and form handling
- **TanStack Query**: For client-side data fetching and caching
- **Zustand**: For client-side state management
- **Prisma**: Database operations with type-safe queries

### Code Organization Rules

#### Import Aliases
```typescript
"@/*": ["./src/*"]           # Main alias for src directory
```

#### File Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: kebab-case (`format-currency.ts`)
- **API Routes**: kebab-case (`route.ts` in folders)
- **Pages**: kebab-case folder names with `page.tsx`

#### Component Structure
```typescript
// 1. Imports (external first, then internal)
// 2. Types and interfaces
// 3. Component definition
// 4. Default export
```

### Database Schema Patterns
- **Enum Types**: Defined in Prisma schema for type safety
- **Relationships**: Proper foreign keys with cascade deletes
- **Indexing**: Strategic indexes for performance
- **Timestamps**: `createdAt` and `updatedAt` on all models
- **Soft Deletes**: Not implemented (using hard deletes with cascades)

### Testing Structure
```
e2e/
├── fixtures/              # Test data and fixtures
├── helpers/               # Test helper functions
├── setup/                 # Test setup and configuration
└── tests/                 # Actual test files
```

## Key Conventions

### Authentication Flow
- Clerk handles authentication with middleware protection
- User data synced to local database via Prisma
- Facebook tokens stored securely in database

### Error Handling
- Server actions return structured error responses
- Client-side error boundaries for component errors
- Toast notifications for user feedback

### Performance Considerations
- Server Components for initial data loading
- TanStack Query for client-side caching
- Optimistic updates for better UX
- Strategic use of React.memo and useMemo

### Security Patterns
- Environment variable validation
- SQL injection prevention via Prisma
- XSS protection through React
- Secure token storage and rotation