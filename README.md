# 🎯 Ad Manager Dashboard

Modern Facebook Ads management platform built with Next.js 15.

## ✨ Features

- 🔐 Secure authentication with Clerk
- 📊 Complete Facebook Ads management (campaigns, ad sets, ads)
- 🎨 Dark/light mode with minimalist UI
- ⚡ Real-time sync with Facebook
- 🛡️ Type-safe with TypeScript & Prisma
- 🧪 E2E tested with Playwright

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
bun run db:setup

# Start development
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📦 Common Commands

```bash
# Development
bun run dev              # Start dev server
bun run build            # Build for production
bun run lint             # Run linter

# Database
bun run db:setup         # Setup database (first time)
bun run prisma:studio    # Open database GUI
bun run prisma:fix-enum  # Fix enum errors

# Testing
bun run test:e2e         # Run E2E tests
bun run test:e2e:ui      # Run tests with UI
```

## 🗄️ Database Setup

```bash
bun run db:setup
```

If you see enum errors:
```bash
bun run prisma:fix-enum
```

## 🔧 Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
FACEBOOK_APP_ID="your_app_id"
FACEBOOK_APP_SECRET="your_app_secret"
```



## 🏗️ Tech Stack

- **Framework:** Next.js 15 + TypeScript
- **Database:** PostgreSQL + Prisma
- **Auth:** Clerk
- **UI:** Tailwind CSS + shadcn/ui
- **State:** TanStack Query + Zustand
- **Testing:** Playwright
- **Runtime:** Bun

## 📁 Project Structure

```
src/
├── app/              # Next.js routes
├── components/       # React components
├── lib/              # Utilities
├── hooks/            # Custom hooks
├── types/            # TypeScript types
└── prisma/           # Database schema
```





## 🚨 Common Issues

**Enum Error:** `bun run prisma:fix-enum`  
**Port in use:** `PORT=3001 bun run dev`  
**Prisma not generated:** `bun run prisma:generate`





## 📝 License

Proprietary and confidential.
