# AGENTS.md - Ad Manager Dashboard

## 📋 Overview

**Ad Manager Dashboard** is a modern Facebook Ads management platform built with Next.js 15, designed for developers who need a minimalist, efficient interface for managing advertising campaigns.

**Core Purpose**: Centralized Facebook advertising management with real-time data synchronization, campaign analytics, and streamlined ad account operations.

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router with Server Actions)
- **Runtime**: Bun (recommended) or Node.js 18+
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: Clerk
- **UI**: Tailwind CSS 4 + Radix UI + shadcn/ui
- **State Management**: Zustand + TanStack Query
- **Tables**: TanStack Table v8 (Universal Table Pattern)
- **Validation**: Zod
- **Testing**: Playwright (E2E) + Vitest (Unit)
- **Language**: TypeScript

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   └── facebook-callback/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── layout.tsx            # Shared dashboard layout
│   │   ├── dashboard/            # Overview & analytics
│   │   └── campaigns/            # Campaign management
│   ├── api/                      # API Routes
│   │   ├── _lib/                 # API utilities (rate limiting)
│   │   ├── ad-accounts/          # Ad account endpoints
│   │   ├── campaigns/            # Campaign CRUD operations
│   │   ├── ad-sets/              # Ad set management
│   │   ├── ads/                  # Ad management
│   │   ├── facebook/             # Facebook API integration
│   │   └── user/                 # User settings
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Root redirect
│   └── globals.css
├── actions/                      # Next.js Server Actions
│   ├── campaigns.ts              # Campaign actions
│   ├── ad-sets.ts                # Ad set actions
│   ├── ads.ts                    # Ad actions
│   └── user.ts                   # User actions
├── components/
│   ├── layout/                   # Layout components
│   │   ├── app-layout.tsx        # Main app wrapper
│   │   ├── header.tsx            # Top navigation bar
│   │   ├── sidebar.tsx           # Desktop sidebar
│   │   └── mobile-sidebar.tsx    # Mobile navigation
│   ├── dashboard/                # Dashboard components
│   │   ├── dashboard-overview.tsx
│   │   ├── dashboard-charts.tsx
│   │   ├── top-campaigns.tsx
│   │   ├── quick-actions.tsx
│   │   ├── ad-account-info.tsx
│   │   ├── ad-account-stats.tsx
│   │   ├── ad-account-status.tsx
│   │   └── dashboard-alerts.tsx
│   ├── facebook/                 # Facebook integration
│   │   ├── facebook-connect-dialog.tsx
│   │   └── facebook-date-range-picker.tsx
│   ├── table/                    # Universal table system
│   │   ├── universal-data-table/
│   │   │   ├── index.tsx         # Main table component
│   │   │   ├── table-header.tsx
│   │   │   ├── table-body.tsx
│   │   │   ├── table-toolbar.tsx
│   │   │   └── table-empty-state.tsx
│   │   ├── columns-selector.tsx
│   │   └── table-pagination.tsx
│   ├── common/                   # Shared components
│   │   ├── theme-provider.tsx
│   │   ├── status-badge.tsx
│   │   ├── format-badge.tsx
│   │   ├── settings-dialog.tsx
│   │   └── smart-navigation.tsx
│   ├── ad-manager/
│   │   └── ad-manager-dashboard.tsx
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── select.tsx
│       ├── input.tsx
│       ├── checkbox.tsx
│       ├── calendar.tsx
│       ├── popover.tsx
│       ├── toast.tsx
│       ├── sheet.tsx
│       ├── separator.tsx
│       ├── skeleton.tsx
│       ├── progress.tsx
│       ├── pagination.tsx
│       ├── label.tsx
│       ├── alert.tsx
│       ├── breadcrumb.tsx
│       ├── textarea.tsx
│       └── toaster.tsx
├── lib/
│   ├── server/                   # Server-only code
│   │   ├── prisma.ts             # Database client
│   │   ├── facebook-api.ts       # Facebook Marketing API
│   │   ├── background-sync.ts    # Data synchronization
│   │   └── api/                  # Database queries
│   │       ├── ad-accounts.ts
│   │       ├── campaigns.ts
│   │       ├── ad-groups.ts
│   │       ├── creatives.ts
│   │       ├── users.ts
│   │       └── facebook-auth.ts
│   ├── client/                   # Client-only code
│   │   ├── table-configs.tsx     # Table configurations
│   │   ├── contexts/
│   │   │   └── user-settings-context.tsx
│   │   ├── providers/
│   │   │   └── query-provider.tsx
│   │   └── stores/
│   │       └── shared-data-store.ts
│   └── shared/                   # Isomorphic utilities
│       ├── utils.ts              # Common utilities
│       ├── formatters.ts         # Data formatting
│       ├── currency.ts           # Currency handling
│       └── validations/
│           └── schemas.ts        # Zod validation schemas
├── hooks/                        # Custom React hooks
│   ├── use-facebook-connection.ts
│   ├── use-shared-data.ts
│   └── use-toast.ts
├── types/                        # TypeScript types
│   ├── index.ts                  # Main type definitions
│   └── facebook-nodejs-business-sdk.d.ts
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Database seeding
├── middleware.ts                 # Next.js middleware (auth)
└── instrumentation.ts            # Next.js instrumentation

e2e/                              # End-to-end tests
├── fixtures/
│   └── test-data.ts
├── helpers/
│   └── test-helpers.ts
├── setup/
│   └── auth.setup.ts
└── tests/
    ├── 01-navigation.spec.ts
    ├── 02-ad-account-selector.spec.ts
    ├── 03-data-tables.spec.ts
    ├── 04-facebook-connection.spec.ts
    ├── 05-date-range-picker.spec.ts
    ├── 06-toast-notifications.spec.ts
    ├── 07-token-expiry.spec.ts
    ├── 08-performance.spec.ts
    └── 09-accessibility.spec.ts
```

## 🗄️ Database Schema

### User
- **Purpose**: User authentication and preferences
- **Key Fields**: `clerkId`, `email`, `name`, `role`, `subscriptionPackage`
- **Settings**: `preferredCurrency`, `preferredLocale`, `preferredTimezone`
- **Relations**: One-to-many with `AdAccount`

### AdAccount
- **Purpose**: Facebook ad account management
- **Key Fields**: `name`, `platform`, `status`, `currency`, `timeZone`
- **Facebook Integration**: `facebookAccessToken`, `facebookTokenExpiry`, `facebookAdAccountId`
- **Relations**: Many-to-one with `User`, One-to-many with `Campaign`

### Campaign
- **Purpose**: Advertising campaign management
- **Key Fields**: `name`, `status`, `budget`, `spent`
- **Metrics**: `impressions`, `clicks`, `ctr`, `conversions`, `costPerConversion`
- **Relations**: Many-to-one with `AdAccount`, One-to-many with `AdGroup`

### AdGroup (Ad Sets)
- **Purpose**: Campaign subdivision for targeting
- **Key Fields**: `name`, `status`, `budget`, `spent`
- **Metrics**: `impressions`, `clicks`, `ctr`, `cpc`, `conversions`
- **Relations**: Many-to-one with `Campaign`, One-to-many with `Creative`

### Creative (Ads)
- **Purpose**: Individual ad creatives
- **Key Fields**: `name`, `format` (Image/Video/Carousel/Story), `status`
- **Metrics**: `impressions`, `clicks`, `ctr`, `engagement`, `spend`, `roas`
- **Relations**: Many-to-one with `AdGroup`

## 🔑 Core Features

### 1. Authentication & Authorization
- Clerk integration for secure authentication
- User roles: USER, ADMIN, SUPER_ADMIN
- Subscription tiers: FREE, STARTER, PROFESSIONAL, ENTERPRISE
- Protected routes via Next.js middleware

### 2. Facebook Integration
- OAuth 2.0 authentication flow
- Real-time token validation with retry mechanism
- Automatic token expiry handling
- Facebook Marketing API v23.0
- Ad account synchronization
- Campaign, Ad Set, and Ad data fetching
- Insights and performance metrics

### 3. Dashboard
- **Overview Tab**: Account stats, top campaigns, quick actions
- **Performance Metrics**: Daily stats, conversion tracking
- **Account Status**: Connection health, token expiry warnings
- **Charts**: Visual representation of campaign performance

### 4. Campaign Management
- **Universal Table Pattern**: Single table component for all entities
- **Three-Tab Interface**:
  - Campaigns: Top-level campaign management
  - Ad Sets: Campaign subdivision management
  - Ads: Individual creative management
- **Operations**: View, duplicate, delete, pause/resume
- **Filtering & Sorting**: Advanced TanStack Table features
- **Column Visibility**: User-customizable columns
- **Pagination**: Efficient data loading

### 5. Data Synchronization
- Background sync service for Facebook data
- Real-time updates via TanStack Query
- Optimistic updates for immediate feedback
- Error handling and retry logic

### 6. User Experience
- **Dark/Light Mode**: System-aware theme switching
- **Responsive Design**: Mobile-first approach
- **Collapsible Sidebar**: Desktop layout optimization
- **Toast Notifications**: User feedback system
- **Loading States**: Skeleton loaders
- **Error Boundaries**: Graceful error handling

## 🔄 Data Flow

### Server Actions Flow
```
User Action → Server Action → Validation (Zod) → Authentication (Clerk)
→ Database Operation (Prisma) → Revalidate Path → UI Update
```

### Facebook Integration Flow
```
User Connects → OAuth Redirect → Token Storage → Token Validation
→ Fetch Ad Accounts → Store in DB → Sync Campaigns → Display Data
```

### Table Data Flow
```
Component Mount → TanStack Query → API Route → Server-side API Query
→ Data Transformation → Cache → Table Render → User Interaction
→ Optimistic Update → Server Action → Revalidation
```

## 📡 API Routes

### Ad Accounts
- `GET /api/ad-accounts` - List all ad accounts
- `GET /api/ad-accounts/[id]` - Get specific ad account
- `GET /api/ad-accounts/[id]/stats` - Get account statistics
- `GET /api/ad-accounts/[id]/daily-stats` - Get daily statistics
- `GET /api/ad-accounts/[id]/overview` - Get account overview
- `GET /api/ad-accounts/[id]/status` - Check account status
- `GET /api/ad-accounts/[id]/top-campaigns` - Get top performing campaigns

### Campaigns
- `GET /api/campaigns` - List campaigns
- `GET /api/campaigns/[id]` - Get campaign details
- `POST /api/campaigns/[id]/duplicate` - Duplicate campaign

### Ad Sets
- `GET /api/ad-sets` - List ad sets
- `GET /api/ad-sets/[id]` - Get ad set details
- `POST /api/ad-sets/[id]/duplicate` - Duplicate ad set

### Ads
- `GET /api/ads` - List ads
- `GET /api/ads/[id]` - Get ad details
- `POST /api/ads/[id]/duplicate` - Duplicate ad

### Facebook Integration
- `GET /api/facebook/check-connection` - Verify Facebook connection
- `POST /api/facebook/connect` - Initiate OAuth flow
- `POST /api/facebook/validate-token` - Validate access token
- `GET /api/facebook/campaigns` - Fetch campaigns from Facebook
- `GET /api/facebook/adsets` - Fetch ad sets from Facebook
- `GET /api/facebook/ads` - Fetch ads from Facebook

### User Settings
- `GET /api/user/settings` - Get user preferences
- `PUT /api/user/settings` - Update user preferences

## 🎯 Key Patterns & Best Practices

### 1. Universal Table Pattern
Single reusable table component configured via table configs:
- **Type-safe**: Generic TypeScript implementation
- **Flexible**: Column definitions, actions, filters per entity
- **Consistent**: Same UI/UX across all data tables
- **Maintainable**: Central location for table logic

### 2. Server Actions
All mutations use Next.js Server Actions:
- **Co-located**: Actions defined near related components
- **Type-safe**: Full TypeScript support
- **Automatic**: Built-in serialization and error handling
- **Fast**: No API route overhead

### 3. Code Organization
- **Route Groups**: `(auth)` and `(dashboard)` for logical separation
- **Private Folders**: `_lib` and `_features` for internal organization
- **Server/Client Split**: Clear boundaries in `lib/server`, `lib/client`
- **Feature-based**: Related code grouped together

### 4. Error Handling
- Token expiry detection with automatic reconnection prompts
- Network error retry mechanisms
- User-friendly error messages
- Comprehensive error logging

### 5. Performance Optimization
- React Query for data caching
- Optimistic updates for instant UI feedback
- Pagination for large datasets
- Code splitting via Next.js dynamic imports
- Image optimization

## 🧪 Testing Strategy

### E2E Tests (Playwright)
1. **Navigation**: Route accessibility and redirects
2. **Ad Account Selector**: Dropdown functionality
3. **Data Tables**: Sorting, filtering, pagination
4. **Facebook Connection**: OAuth flow
5. **Date Range Picker**: Date selection
6. **Toast Notifications**: User feedback
7. **Token Expiry**: Error handling
8. **Performance**: Load times and rendering
9. **Accessibility**: ARIA compliance

### Unit Tests (Vitest)
- Component testing with React Testing Library
- Utility function testing
- Validation schema testing

## 🚀 Development Commands

```bash
# Development
bun run dev                    # Start dev server
bun run build                  # Production build
bun run start                  # Start production server

# Code Quality
bun run lint                   # Run ESLint
bun run typecheck              # TypeScript check

# Database
bun run prisma:generate        # Generate Prisma client
bun run prisma:push            # Push schema to DB
bun run prisma:migrate         # Run migrations
bun run prisma:studio          # Open Prisma Studio

# Testing
bun run test:e2e              # Run all E2E tests
bun run test:e2e:ui           # Playwright UI mode
bun run test:e2e:headed       # Run with browser
bun run test:e2e:debug        # Debug mode
bun run test:e2e:report       # View test report
```

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Facebook Integration
FACEBOOK_APP_ID="..."
FACEBOOK_APP_SECRET="..."
FACEBOOK_REDIRECT_URI="..."
```

## 🎨 Design Philosophy

### Minimalist Developer-First UI
- **Monospace Font**: JetBrains Mono throughout
- **Terminal-Inspired**: Dark theme by default
- **Clean Layout**: Maximum content, minimal chrome
- **Fast Navigation**: Keyboard shortcuts where applicable
- **Data Density**: Compact tables with clear hierarchy

### Theme System
- CSS variables for all colors
- Dark/light mode support
- System preference detection
- Smooth transitions
- Accessible contrast ratios

## 📊 Monitoring & Instrumentation

- Next.js instrumentation API for performance tracking
- Error boundary components for graceful degradation
- Console logging for debugging (removed in production)
- Rate limiting on API routes

## 🔒 Security

- Environment variable validation
- SQL injection prevention via Prisma
- XSS protection via React
- CSRF protection via Next.js
- Secure token storage
- Rate limiting on sensitive endpoints
- Authentication on all protected routes

## 📚 Dependencies

### Core
- `next@^15.1.4` - Framework
- `react@^18.3.1` - UI library
- `typescript@^5.7.3` - Type safety

### Database & Auth
- `@prisma/client@^6.16.3` - ORM
- `@clerk/nextjs@^6.33.1` - Authentication

### UI & Styling
- `tailwindcss@^4.0.0` - Styling
- `@radix-ui/*` - Headless UI components
- `lucide-react@^0.469.0` - Icons

### State & Data
- `@tanstack/react-query@^5.90.2` - Server state
- `zustand@^5.0.8` - Client state
- `zod@^3.24.1` - Validation

### Facebook Integration
- `facebook-nodejs-business-sdk@^23.0.2` - Marketing API

### Testing
- `@playwright/test@^1.48.0` - E2E testing
- `vitest` - Unit testing (configured)

## 🎯 Current Status

### ✅ Implemented
- Full Facebook integration with OAuth
- Campaign, Ad Set, and Ad management
- Universal data table system
- Dark/light theme support
- User authentication and authorization
- Database schema and relationships
- Server Actions for mutations
- API routes for data fetching
- Responsive layout
- E2E test suite

### 🔄 Architecture Features
- Next.js 15 with App Router
- TypeScript strict mode
- Server/Client code separation
- Route groups for organization
- Optimistic UI updates
- Error boundaries
- Rate limiting

### 🎨 UI/UX Complete
- Minimalist developer theme
- Collapsible sidebar
- Ad account selector
- Dashboard overview
- Campaign management tabs
- Toast notifications
- Loading states
- Empty states

## 💡 Usage Notes

### Getting Started
1. Set up PostgreSQL database
2. Configure environment variables
3. Run `bun install`
4. Run `bun run prisma:push`
5. Start dev server with `bun run dev`
6. Connect Facebook account
7. Select ad account from dropdown
8. View and manage campaigns

### Facebook Connection
- OAuth flow handles token management
- Tokens stored securely in database
- Automatic expiry detection and re-auth prompts
- Supports multiple ad accounts per user

### Data Management
- All data cached via TanStack Query
- Manual refresh via refresh button
- Automatic background sync (configurable)
- Optimistic updates for instant feedback

---

**Last Updated**: 2025-10-05  
**Framework Version**: Next.js 15.1.4  
**Database**: PostgreSQL via Prisma  
**Primary Platform**: Facebook Ads
