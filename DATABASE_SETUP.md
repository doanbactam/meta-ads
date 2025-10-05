# Database Setup Guide

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup database (generates Prisma client, pushes schema, fixes enums)
npm run db:setup
```

That's it! Your database is ready to use.

---

## 📋 Available Database Commands

### Essential Commands

```bash
# Setup database from scratch (recommended for first time)
npm run db:setup

# Generate Prisma client only
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Fix platform enum values (lowercase → uppercase)
npm run prisma:fix-enum
```

### Development Commands

```bash
# Start development server (auto-generates Prisma client)
npm run dev

# Reset database and fix enums
npm run db:reset

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

---

## 🔧 What Each Script Does

### `npm run db:setup`
**Complete database setup**
- Generates Prisma client
- Pushes schema to database
- Fixes platform enum values
- **Use this for first-time setup**

### `npm run prisma:fix-enum`
**Fixes platform enum values**
- Converts 'facebook' → 'FACEBOOK'
- Converts 'instagram' → 'INSTAGRAM'
- Converts 'linkedin' → 'LINKEDIN'
- Converts 'messenger' → 'MESSENGER'
- **Fixes the Prisma enum error**

### `npm run db:reset`
**Complete database reset**
- Force resets database
- Pushes fresh schema
- Fixes enum values
- **WARNING: Deletes all data!**

### `npm run postinstall`
**Runs automatically after npm install**
- Generates Prisma client
- Ensures types are available

---

## 🐛 Troubleshooting

### Error: "DATABASE_URL not set"

**Solution:**
Create `.env` file in project root:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### Error: "psql command not found"

**Solution:**
Install PostgreSQL client:

**macOS:**
```bash
brew install postgresql
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

### Error: "Value 'facebook' not found in enum 'Platform'"

**Solution:**
Run the enum fix:
```bash
npm run prisma:fix-enum
```

### Error: "Connection refused"

**Solution:**
1. Check if PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. Test connection: `psql $DATABASE_URL`

---

## 📊 Database Schema Updates

### When You Modify schema.prisma:

```bash
# Push changes to database
npm run prisma:push

# Or create a migration (production)
npm run prisma:migrate

# Don't forget to regenerate client
npm run prisma:generate
```

### After Pulling Changes:

```bash
# Regenerate Prisma client
npm run prisma:generate

# If schema changed, push to database
npm run prisma:push
```

---

## 🔄 Workflow Examples

### Starting Fresh Project

```bash
# Clone repository
git clone <repo-url>
cd ad-manager-dashboard

# Setup everything
npm install
npm run db:setup

# Start development
npm run dev
```

### Daily Development

```bash
# Start dev server (auto-generates Prisma client)
npm run dev

# If schema changed
npm run prisma:push
```

### Fixing Enum Error

```bash
# Quick fix
npm run prisma:fix-enum

# Or full reset (deletes data!)
npm run db:reset
```

### Before Deployment

```bash
# Build production
npm run build

# Includes: prisma generate + next build
```

---

## 📝 Environment Variables

Required in `.env`:

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."

# Facebook Integration
FACEBOOK_APP_ID="..."
FACEBOOK_APP_SECRET="..."
FACEBOOK_REDIRECT_URI="..."
```

---

## 🎯 Common Scenarios

### Scenario 1: New Developer Setup
```bash
npm install        # Installs deps + runs postinstall (generates Prisma)
npm run db:setup   # Sets up database
npm run dev        # Start development
```

### Scenario 2: Schema Changed (Pull)
```bash
git pull
npm run prisma:generate  # Update Prisma client
npm run prisma:push      # Update database
```

### Scenario 3: Database Issues
```bash
npm run db:reset         # Nuclear option - deletes all data!
# Or
npm run prisma:fix-enum  # Just fix enum values
```

### Scenario 4: Production Deployment
```bash
npm install              # Generates Prisma client automatically
npm run build           # Builds app
npm run start           # Starts production server
```

---

## 🔐 Production Migrations

For production, use migrations instead of `db push`:

```bash
# Create migration
npm run prisma:migrate

# This creates a migration file
# Commit this file to version control

# Deploy migrations in production
npx prisma migrate deploy
```

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Project Documentation](./OPTIMIZATION_SUMMARY.md)
- [Quick Reference](./QUICK_REFERENCE.md)

---

## ✅ Quick Checklist

Before starting development:
- [ ] PostgreSQL installed and running
- [ ] `.env` file created with DATABASE_URL
- [ ] `npm install` completed
- [ ] `npm run db:setup` completed
- [ ] Can connect: `npm run prisma:studio`
- [ ] Dev server starts: `npm run dev`

---

**Need Help?**
- Check error message in terminal
- Run `npm run prisma:studio` to inspect database
- Verify environment variables in `.env`
- Try `npm run db:reset` (deletes data!)

---

**Last Updated:** 2025-10-05  
**Version:** 1.1.0
