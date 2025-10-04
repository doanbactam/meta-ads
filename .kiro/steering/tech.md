# Technology Stack

## Framework & Core

- **Next.js 15** - React framework with App Router
- **TypeScript 5.7+** - Strict mode enabled
- **React 18** - Server and client components

## Database & ORM

- **Prisma 6.16** - Type-safe database ORM
- **PostgreSQL** - Primary database
- Schema uses snake_case for database columns, camelCase in TypeScript

## Authentication & Authorization

- **Clerk** - User authentication and management
- Middleware protects all routes except `/sign-in` and `/sign-up`
- Role-based access control via User model

## UI & Styling

- **Tailwind CSS 4** - Utility-first CSS with CSS variables
- **Radix UI** - Headless component primitives
- **shadcn/ui** - Pre-built component library (default style, neutral base color)
- **Lucide React** - Icon library
- **next-themes** - Theme management (dark mode default)
- **JetBrains Mono** - Monospace font

## Data Management

- **TanStack Query (React Query)** - Server state management
- **TanStack Table v8** - Advanced table functionality
- **Zustand** - Client state management
- **Zod** - Runtime validation and schema definition
- **React Hook Form** - Form handling with Zod resolvers

## External APIs

- **Facebook Business SDK** - Facebook/Instagram ads integration

## Package Manager

- **bun** - Fast JavaScript runtime and package manager
- Use `bun` for all build, install, and run commands

## Common Commands

```bash
# Development
bun run dev                 # Start dev server (localhost:3000)
bun run build              # Build for production (includes Prisma generate)
bun run start              # Start production server
bun run lint               # Run ESLint
bun run typecheck          # TypeScript type checking

# Database
bun run prisma:generate    # Generate Prisma Client
bun run prisma:push        # Push schema to database
bun run prisma:migrate     # Run migrations
bun run prisma:studio      # Open Prisma Studio GUI

# Package Management
bun install                # Install dependencies
bun add <package>          # Add package
bun remove <package>       # Remove package
```

## Path Aliases

- `@/*` - Root directory
- `@/components` - React components
- `@/lib` - Utility functions and shared logic
- `@/hooks` - Custom React hooks
- `@/types` - TypeScript type definitions

## Build Configuration

- ESLint errors ignored during builds (`ignoreDuringBuilds: true`)
- Strict TypeScript with no emit (Next.js handles compilation)
- Module resolution: bundler
