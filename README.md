# 🎯 Ad Manager Dashboard

Modern Facebook Ads management platform built with Next.js 15, designed for developers who need a minimalist, efficient interface for managing advertising campaigns.

[![Next.js](https://img.shields.io/badge/Next.js-15.1.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16.3-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0.0-38B2AC)](https://tailwindcss.com/)

---

## ✨ Features

- 🔐 **Secure Authentication** - Clerk integration with role-based access
- 📊 **Facebook Ads Management** - Complete campaign, ad set, and ad management
- 🎨 **Modern UI** - Dark/light mode with minimalist developer-first design
- 📱 **Responsive** - Mobile-first design that works on all devices
- ⚡ **Real-time Sync** - Automatic data synchronization with Facebook
- 🔄 **Smart Caching** - TanStack Query for optimal performance
- 🛡️ **Type-Safe** - Full TypeScript with Prisma ORM
- 🧪 **Tested** - Comprehensive E2E tests with Playwright

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Facebook Developer Account (for ad management)

### Installation

```bash
# 1. Clone repository
git clone <your-repo-url>
cd ad-manager-dashboard

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Setup database
npm run db:setup

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript check
```

### Database

```bash
npm run db:setup           # Complete database setup (first time)
npm run db:reset           # Reset database (⚠️ deletes data)
npm run prisma:fix-enum    # Fix platform enum values
npm run prisma:generate    # Generate Prisma client
npm run prisma:push        # Push schema to database
npm run prisma:migrate     # Create migration
npm run prisma:studio      # Open Prisma Studio (database GUI)
```

### Testing

```bash
npm run test:e2e           # Run E2E tests
npm run test:e2e:ui        # Run tests with Playwright UI
npm run test:e2e:headed    # Run tests in headed mode
npm run test:e2e:debug     # Debug tests
```

📚 **See [README_SCRIPTS.md](./README_SCRIPTS.md) for detailed script documentation**

---

## 🗄️ Database Setup

### First Time Setup

```bash
npm run db:setup
```

This command:
1. Generates Prisma client
2. Pushes schema to database
3. Fixes platform enum values

### Fixing Enum Error

If you see: `Value 'facebook' not found in enum 'Platform'`

```bash
npm run prisma:fix-enum
```

📚 **See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed database guide**

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Facebook Integration
FACEBOOK_APP_ID="your_app_id"
FACEBOOK_APP_SECRET="your_app_secret"
FACEBOOK_REDIRECT_URI="http://localhost:3000/facebook-callback"
```

---

## 📚 Documentation

- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Complete database setup guide
- **[README_SCRIPTS.md](./README_SCRIPTS.md)** - All available npm scripts
- **[OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md)** - Recent optimizations and fixes
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference guide
- **[AGENTS.md](./AGENTS.md)** - Architecture and technical documentation

---

## 🏗️ Tech Stack

### Core
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.7
- **Runtime:** Node.js 18+ or Bun

### Database & ORM
- **Database:** PostgreSQL
- **ORM:** Prisma 6.16
- **Client:** @prisma/client

### Authentication
- **Provider:** Clerk
- **Features:** OAuth, role-based access, session management

### UI & Styling
- **CSS:** Tailwind CSS 4.0
- **Components:** Radix UI
- **UI Library:** shadcn/ui
- **Icons:** Lucide React
- **Theme:** next-themes (dark/light mode)

### State Management
- **Server State:** TanStack Query (React Query)
- **Client State:** Zustand
- **Form Validation:** Zod

### Testing
- **E2E:** Playwright
- **Test Framework:** @playwright/test

### APIs & Integrations
- **Facebook Ads:** facebook-nodejs-business-sdk
- **Marketing API:** v23.0

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── dashboard/        # Dashboard components
│   ├── table/            # Universal table system
│   ├── facebook/         # Facebook integration
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── server/           # Server-only code
│   ├── client/           # Client-only code
│   └── shared/           # Isomorphic utilities
├── hooks/                # Custom React hooks
├── types/                # TypeScript types
└── prisma/               # Database schema

scripts/                   # Build & setup scripts
e2e/                      # End-to-end tests
prisma/migrations/        # Database migrations
```

---

## 🎯 Key Features

### Dashboard Overview
- Real-time ad account statistics
- Top performing campaigns
- Daily performance charts
- Account status monitoring

### Campaign Management
- List, view, edit, duplicate, delete campaigns
- Advanced filtering and sorting
- Column customization
- Bulk operations

### Ad Set Management
- Manage targeting groups
- Budget allocation
- Performance metrics
- Ad set duplication

### Ad Management
- Creative management
- Format support (Image, Video, Carousel, Story)
- Performance tracking
- Preview functionality

### Facebook Integration
- OAuth 2.0 authentication
- Automatic token management
- Multiple ad account support
- Real-time data sync
- Token expiry warnings

---

## 🔐 Security

- ✅ Environment variable validation
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (React)
- ✅ CSRF protection (Next.js)
- ✅ Secure token storage
- ✅ Rate limiting on API routes
- ✅ Role-based access control

---

## 🚨 Common Issues & Solutions

### Issue: Prisma Enum Error
**Error:** `Value 'facebook' not found in enum 'Platform'`

**Solution:**
```bash
npm run prisma:fix-enum
```

### Issue: DATABASE_URL Not Set
**Solution:** Create `.env` file with proper `DATABASE_URL`

### Issue: Port Already in Use
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Issue: Prisma Client Not Generated
**Solution:**
```bash
npm run prisma:generate
```

---

## 📈 Performance

- ⚡ Server-side rendering with Next.js 15
- 🎯 Optimistic UI updates
- 💾 Smart caching with TanStack Query
- 📦 Code splitting and lazy loading
- 🖼️ Image optimization
- 🔄 Background data synchronization

---

## 🧪 Testing

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/tests/01-navigation.spec.ts

# Run tests in UI mode (recommended for debugging)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

### Test Coverage
- ✅ Navigation & routing
- ✅ Ad account selector
- ✅ Data tables (sorting, filtering, pagination)
- ✅ Facebook connection flow
- ✅ Date range picker
- ✅ Toast notifications
- ✅ Token expiry handling
- ✅ Performance benchmarks
- ✅ Accessibility (ARIA)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is proprietary and confidential.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Clerk](https://clerk.com/) - Authentication
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

## 📞 Support

For support and questions:
- 📖 Check [Documentation](./DATABASE_SETUP.md)
- 🐛 [Report Issues](./issues)
- 💬 [Discussions](./discussions)

---

## 🗺️ Roadmap

- [ ] Multi-platform support (Instagram, LinkedIn)
- [ ] Advanced analytics dashboard
- [ ] Bulk campaign operations
- [ ] Campaign templates
- [ ] Scheduled posts
- [ ] A/B testing tools
- [ ] Export functionality (CSV, Excel)
- [ ] Webhook support
- [ ] Team collaboration features
- [ ] Advanced reporting

---

**Built with ❤️ using Next.js 15**

**Version:** 1.1.0  
**Last Updated:** 2025-10-05
