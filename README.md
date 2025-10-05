# Ad Manager Dashboard

Modern advertising management dashboard built with Next.js 15, featuring a modernized 2025 folder structure, Server Actions, comprehensive testing infrastructure, and best-in-class developer experience.

## Features

✅ **Prisma ORM Integration**
- PostgreSQL database with comprehensive schema
- Type-safe database access
- Relations between ad accounts, campaigns, ad groups, and creatives

✅ **Zod Validation**
- Runtime type validation
- Schema validation for all data models

✅ **TanStack Table v8**
- Advanced data table functionality
- Column visibility control
- Sorting and filtering capabilities

✅ **Modern UI**
- Tailwind CSS 4
- Collapsible sidebar with toggle
- Dark/Light mode support
- Ad account selector in navigation

✅ **Multi-Platform Support**
- Facebook Ads
- Instagram Ads
- LinkedIn Ads
- Messenger Ads

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Bun (recommended) or Node.js 18+
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **Tables**: TanStack Table v8 (Universal Table pattern)
- **State Management**: Zustand + TanStack Query
- **Validation**: Zod
- **Authentication**: Clerk
- **Testing**: Vitest + React Testing Library
- **Language**: TypeScript
- **Server Actions**: Next.js 15 Server Actions
- **Instrumentation**: Next.js 15 instrumentation API

## Getting Started

### Prerequisites

- Bun (recommended) or Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies
```bash
bun install
# or npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and add your database connection:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/admanager?schema=public"
```

4. Generate Prisma Client
```bash
bun run prisma:generate
```

5. Push database schema
```bash
bun run prisma:push
```

6. Seed the database with sample data
```bash
bun run prisma:seed
```

7. Run the development server
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run typecheck` - Run TypeScript type checking
- `bun run test` - Run tests with Vitest
- `bun run test:watch` - Run tests in watch mode
- `bun run test:coverage` - Generate test coverage report
- `bun run prisma:generate` - Generate Prisma Client
- `bun run prisma:push` - Push schema changes to database
- `bun run prisma:migrate` - Run database migrations
- `bun run prisma:studio` - Open Prisma Studio

## Database Schema

### AdAccount
- Multiple ad accounts per platform
- Platform: facebook, instagram, linkedin, messenger
- Status tracking

### Campaign
- Linked to ad account
- Budget and spend tracking
- Performance metrics (impressions, clicks, CTR, conversions)

### AdGroup
- Linked to campaign
- Granular budget control
- Detailed performance data

### Creative
- Linked to ad group
- Multiple formats (Image, Video, Carousel, Story)
- Engagement and ROAS tracking

## Project Structure (2025 Modernized)

This project follows Next.js 15 best practices with a modern `src/` folder structure:

```
├── src/                        # All application code
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard route group
│   │   │   ├── layout.tsx      # Shared dashboard layout
│   │   │   ├── campaigns/
│   │   │   ├── analytics/
│   │   │   ├── dashboard/
│   │   │   └── support/
│   │   ├── (auth)/             # Auth route group
│   │   │   ├── sign-in/
│   │   │   ├── sign-up/
│   │   │   └── facebook-callback/
│   │   ├── api/                # API routes
│   │   │   └── _lib/           # API utilities
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── actions/                # Server Actions
│   │   ├── campaigns.ts
│   │   ├── ad-sets.ts
│   │   ├── ads.ts
│   │   └── user.ts
│   ├── components/
│   │   ├── _features/          # Feature-specific components
│   │   ├── ui/                 # shadcn/ui components
│   │   └── ...                 # Shared components
│   ├── lib/
│   │   ├── server/             # Server-only code
│   │   │   ├── api/            # Database queries
│   │   │   ├── prisma.ts
│   │   │   ├── facebook-api.ts
│   │   │   └── background-sync.ts
│   │   ├── shared/             # Isomorphic utilities
│   │   │   ├── validations/
│   │   │   ├── utils.ts
│   │   │   ├── formatters.ts
│   │   │   └── currency.ts
│   │   └── client/             # Client-only code
│   │       ├── contexts/
│   │       ├── providers/
│   │       ├── stores/
│   │       └── table-configs.tsx
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript types
│   ├── prisma/                 # Prisma schema & seeds
│   ├── scripts/                # Utility scripts
│   ├── __tests__/              # Test setup
│   ├── middleware.ts           # Next.js middleware
│   └── instrumentation.ts      # Next.js instrumentation
├── docs/                       # Documentation
│   ├── architecture/
│   ├── migrations/
│   └── integrations/
├── archive/                    # Legacy code
├── vitest.config.ts            # Test configuration
├── tsconfig.json
├── next.config.js
└── package.json
```

📖 **For a detailed explanation of the folder structure, see [docs/migrations/folder-structure-2025.md](docs/migrations/folder-structure-2025.md)**

## Recent Improvements

### Folder Structure Modernization (2025)
✅ **src/ Directory** - All application code organized under `src/`
✅ **Route Groups** - Logical grouping with `(dashboard)` and `(auth)`
✅ **Server/Client Separation** - Clear boundaries in `lib/server`, `lib/client`, `lib/shared`
✅ **Server Actions** - Dedicated `actions/` folder with proper validation
✅ **Private Folders** - `_lib` and `_features` for organizational clarity
✅ **Test Infrastructure** - Vitest setup with comprehensive mocking
✅ **Documentation** - Standard `docs/` folder with architecture guides

### Previous Improvements
1. **Prisma ORM** - Better type safety and flexibility
2. **Universal Table Pattern** - Single table component for all entities
3. **Zod Validation** - Comprehensive validation schemas
4. **TanStack Table v8** - Advanced table features
5. **Next.js 15** - Latest framework features including Server Actions
6. **Tailwind CSS 4** - Improved performance and developer experience

## Troubleshooting

### Error: "The table `public.users` does not exist"

This error occurs when the database hasn't been initialized. Follow these steps:

1. Ensure your `.env` file exists and has a valid `DATABASE_URL`:
```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL
```

2. Generate Prisma Client:
```bash
npm run prisma:generate
```

3. Push the schema to your database:
```bash
npm run prisma:push
```

4. Verify the tables were created:
```bash
npm run prisma:studio
```

### Error: "Environment variable not found: DATABASE_URL"

Make sure you've created a `.env` file from `.env.example` and configured all required environment variables including:
- `DATABASE_URL` - PostgreSQL connection string
- Clerk authentication keys
- Facebook API credentials (if using Facebook integration)

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- 📚 [Getting Started Guide](docs/getting-started.md)
- 🏗️ [Architecture Documentation](docs/architecture/)
  - [Folder Structure](docs/architecture/folder-structure.md)
  - [Tech Stack](docs/architecture/tech-stack.md)
  - [Naming Conventions](docs/architecture/naming-conventions.md)
  - [UI Patterns](docs/architecture/ui-patterns.md)
  - [Server Actions](docs/architecture/server-actions.md)
  - [Testing](docs/architecture/testing.md)
- 🔄 [Migration Guides](docs/migrations/)
  - [Next.js 15 Migration](docs/migrations/nextjs15-migration.md)
  - [Universal Table Migration](docs/migrations/universal-table-migration.md)
  - [Folder Structure 2025](docs/migrations/folder-structure-2025.md)
- 🔌 [Integrations](docs/integrations/)
  - [Facebook Integration](docs/integrations/facebook.md)

## Contributing

Contributions are welcome! Please see [docs/contributing.md](docs/contributing.md) for guidelines.

## License

MIT
