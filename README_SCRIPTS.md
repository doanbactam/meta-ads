# 📦 Package Scripts Reference

Quick reference for all npm scripts in this project.

---

## 🚀 Development

```bash
# Start development server (auto-generates Prisma client)
npm run dev

# Type checking
npm run typecheck

# Lint code
npm run lint
```

---

## 🗄️ Database Scripts

### Setup & Maintenance

```bash
# ⭐ First-time setup (generates client + pushes schema + fixes enums)
npm run db:setup

# 🔄 Reset database (WARNING: deletes all data!)
npm run db:reset

# 🔧 Fix platform enum values only
npm run prisma:fix-enum
```

### Prisma Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Create migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

---

## 🏗️ Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm run start

# Auto-runs after npm install
npm run postinstall
```

---

## 🧪 Testing

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Browser-specific tests
npm run test:e2e:chrome
npm run test:e2e:firefox
npm run test:e2e:webkit

# View test report
npm run test:e2e:report
```

---

## 📋 Script Details

| Script | Description | When to Use |
|--------|-------------|-------------|
| `dev` | Start development server | Daily development |
| `build` | Build for production | Before deployment |
| `start` | Run production build | Production server |
| `db:setup` | Complete database setup | First-time setup, new developers |
| `db:reset` | Reset database | Fix corrupted data, start fresh |
| `prisma:fix-enum` | Fix enum values | After Prisma enum error |
| `prisma:generate` | Generate Prisma client | After schema changes |
| `prisma:push` | Push schema to DB | Update database schema |
| `prisma:migrate` | Create migration | Production schema changes |
| `prisma:studio` | Open database GUI | Inspect/edit data |
| `postinstall` | Auto-generate Prisma | Runs after npm install |

---

## 🔄 Common Workflows

### New Developer Setup
```bash
npm install        # Installs dependencies
npm run db:setup   # Sets up database
npm run dev        # Start developing
```

### After Schema Changes
```bash
npm run prisma:generate  # Update client
npm run prisma:push      # Update database
```

### Fixing Enum Error
```bash
npm run prisma:fix-enum  # Quick fix
```

### Starting Fresh
```bash
npm run db:reset   # WARNING: Deletes all data!
npm run dev        # Start fresh
```

---

## 💡 Pro Tips

### Development
- `npm run dev` automatically generates Prisma client
- Use `npm run prisma:studio` to visualize database
- `npm run typecheck` catches TypeScript errors before build

### Database
- Always run `npm run prisma:generate` after schema changes
- Use `db:setup` for clean slate, `prisma:fix-enum` for quick fixes
- `db:reset` is destructive - use carefully!

### Testing
- `test:e2e:ui` is great for debugging tests
- `test:e2e:headed` shows browser actions
- `test:e2e:debug` allows step-by-step debugging

---

## 🎯 Quick Commands

Most used commands:

```bash
npm run dev                  # Start development
npm run db:setup             # First-time setup
npm run prisma:fix-enum      # Fix enum error
npm run prisma:studio        # Browse database
npm run build                # Production build
```

---

## 🔗 Related Documentation

- [Database Setup Guide](./DATABASE_SETUP.md) - Detailed database instructions
- [Optimization Summary](./OPTIMIZATION_SUMMARY.md) - Recent changes
- [Quick Reference](./QUICK_REFERENCE.md) - Quick start guide

---

**Last Updated:** 2025-10-05
