# Project Structure

## Directory Organization

```
├── app/                      # Next.js App Router
│   ├── api/                 # API route handlers
│   │   ├── ads/            # Ad (creative) CRUD endpoints
│   │   ├── ad-sets/        # Ad group CRUD endpoints
│   │   └── campaigns/      # Campaign CRUD endpoints
│   ├── facebook-callback/  # OAuth callback handler
│   ├── sign-in/            # Authentication pages
│   ├── sign-up/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles and CSS variables
│
├── components/              # React components
│   ├── ui/                 # shadcn/ui components (auto-generated)
│   ├── *-table.tsx         # TanStack Table implementations
│   ├── *-dashboard.tsx     # Page-level components
│   ├── header.tsx          # Navigation header
│   ├── sidebar.tsx         # Collapsible sidebar
│   └── theme-provider.tsx  # Theme context wrapper
│
├── lib/                     # Shared utilities and logic
│   ├── api/                # API client functions
│   │   ├── ad-accounts.ts
│   │   ├── campaigns.ts
│   │   ├── ad-groups.ts
│   │   └── creatives.ts
│   ├── providers/          # React context providers
│   ├── stores/             # Zustand stores
│   ├── validations/        # Zod schemas
│   ├── prisma.ts           # Prisma client singleton
│   ├── facebook-api.ts     # Facebook SDK wrapper
│   ├── rate-limiter.ts     # API rate limiting
│   ├── formatters.ts       # Data formatting utilities
│   └── utils.ts            # General utilities (cn helper)
│
├── hooks/                   # Custom React hooks
│   ├── use-toast.ts
│   └── use-facebook-connection.ts
│
├── types/                   # TypeScript definitions
│   ├── index.ts            # Shared types
│   └── facebook-nodejs-business-sdk.d.ts
│
├── prisma/                  # Database configuration
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data script
│
└── middleware.ts            # Clerk authentication middleware
```

## Naming Conventions

- **Files**: kebab-case (e.g., `ad-groups-table.tsx`)
- **Components**: PascalCase (e.g., `AdGroupsTable`)
- **Functions/Variables**: camelCase (e.g., `fetchCampaigns`)
- **Database columns**: snake_case (e.g., `ad_account_id`)
- **TypeScript types**: PascalCase (e.g., `Campaign`)
- **API routes**: RESTful with `[id]` dynamic segments

## Component Patterns

- Server components by default (no 'use client' unless needed)
- Client components for interactivity (tables, forms, dialogs)
- Colocation of related components in feature folders
- shadcn/ui components in `components/ui/` (managed by CLI)

## API Route Structure

- CRUD operations follow REST conventions
- `GET /api/resource` - List all
- `GET /api/resource/[id]` - Get one
- `POST /api/resource` - Create
- `PATCH /api/resource/[id]` - Update
- `DELETE /api/resource/[id]` - Delete
- `POST /api/resource/[id]/duplicate` - Duplicate resource

## Database Schema Hierarchy

```
User (Clerk authentication)
  └── AdAccount (platform-specific)
      └── Campaign (budget, schedule)
          └── AdGroup (targeting)
              └── Creative (ad content)
```

All relationships use cascade delete for data integrity.
