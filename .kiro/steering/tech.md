# Technology Stack & Build System

## Core Technologies

### Framework & Runtime
- **Next.js 15** with App Router (React Server Components)
- **TypeScript 5.7** for type safety
- **React 18** with modern hooks and patterns
- **Node.js 18+** or **Bun** as runtime

### Database & ORM
- **PostgreSQL** as primary database
- **Prisma 6.16** as ORM with custom schema location: `src/prisma/schema.prisma`
- Database migrations managed through Prisma

### Authentication & Security
- **Clerk** for authentication with OAuth support
- Role-based access control (USER, ADMIN, SUPER_ADMIN)
- Secure token management for Facebook API

### UI & Styling
- **Tailwind CSS 4.0** with CSS variables for theming
- **shadcn/ui** component library with Radix UI primitives
- **Lucide React** for icons
- **next-themes** for dark/light mode support

### State Management
- **TanStack Query (React Query)** for server state
- **Zustand** for client state management
- **Zod** for schema validation

### External APIs
- **Facebook Marketing API v23.0** via `facebook-nodejs-business-sdk`
- Custom Facebook integration with token management

## Code Quality & Tooling

### Linting & Formatting
- **Biome** for linting and formatting (replaces ESLint + Prettier)
- Configuration: 2-space indentation, 100 character line width
- Single quotes for JS, double quotes for JSX

### Testing
- **Playwright** for E2E testing with multi-browser support
- Test files located in `e2e/` directory
- Comprehensive test coverage for UI flows and API integration

## Common Commands

### Development
```bash
bun run dev          # Start development server with Prisma generation
bun run build        # Production build
bun run start        # Start production server
bun run typecheck    # TypeScript type checking
```

### Code Quality
```bash
bun run lint         # Run Biome linter
bun run lint:fix     # Fix linting issues
bun run format       # Format code with Biome
```

### Database Operations
```bash
bun run db:setup           # Complete database setup (first time)
bun run db:reset           # Reset database (⚠️ deletes data)
bun run prisma:generate    # Generate Prisma client
bun run prisma:push        # Push schema to database
bun run prisma:migrate     # Create and run migrations
bun run prisma:studio      # Open Prisma Studio GUI
bun run prisma:fix-enum    # Fix platform enum values
bun run prisma:fix-schema  # Fix database schema issues
```

### Testing
```bash
bun run test:e2e           # Run E2E tests
bun run test:e2e:ui        # Run tests with Playwright UI
bun run test:e2e:headed    # Run tests in headed mode
bun run test:e2e:debug     # Debug tests
```

## Build System Notes

- Uses **Bun** as preferred package manager and runtime
- Custom database setup scripts in `scripts/` directory
- Automatic Prisma client generation on `postinstall`
- ESLint disabled during builds (using Biome instead)
- Custom Prisma schema location requires explicit path configuration