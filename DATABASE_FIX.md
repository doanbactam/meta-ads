# Database Schema Fix Guide

## Problem
You're encountering this error:
```
Invalid `prisma.adAccount.findMany()` invocation:
Error occurred during query execution: ConnectorError(ConnectorError { 
  user_facing_error: None, 
  kind: QueryError(PostgresError { 
    code: "42704", 
    message: "type \"public.Platform\" does not exist"
  })
})
```

## Root Cause
The PostgreSQL database is missing the `Platform` enum type that's defined in your Prisma schema. This happens when:
- The database was created before the enum was added
- Migrations weren't run properly
- The schema was pushed without proper enum type creation

## Solution

### Option 1: Automated Fix (Recommended)
Run the fix script with your database connection:

```bash
# If you have DATABASE_URL in .env file:
npm run db:fix

# Or pass DATABASE_URL directly:
DATABASE_URL="postgresql://user:password@localhost:5432/admanager" npm run db:fix
```

### Option 2: Manual SQL Fix
If the script doesn't work, run this SQL directly in your PostgreSQL database:

```sql
-- Create the Platform enum type
CREATE TYPE "Platform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'MESSENGER');

-- Convert existing platform column to use the enum
ALTER TABLE ad_accounts 
ALTER COLUMN platform TYPE "Platform" 
USING platform::"Platform";

-- Set default value
ALTER TABLE ad_accounts 
ALTER COLUMN platform SET DEFAULT 'FACEBOOK'::"Platform";
```

### Option 3: Full Database Reset
If you can afford to reset your database:

```bash
npm run db:reset
```

## After Fixing

1. **Regenerate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

2. **Restart your development server:**
   ```bash
   npm run dev
   ```

## Verification

To verify the fix worked, you can:

1. Check the enum exists in PostgreSQL:
   ```sql
   SELECT enum_range(NULL::Platform);
   ```
   Should return: `{FACEBOOK,INSTAGRAM,LINKEDIN,MESSENGER}`

2. Check the column type:
   ```sql
   SELECT column_name, data_type, udt_name 
   FROM information_schema.columns 
   WHERE table_name = 'ad_accounts' AND column_name = 'platform';
   ```
   Should show `udt_name = 'Platform'`

## Prevention

To prevent this in the future:
- Always run `npm run db:setup` after pulling schema changes
- Use proper migrations: `npm run prisma:migrate` instead of just `prisma:push`
- Keep your database schema in sync with Prisma schema

## Need Help?

If you're still having issues:
1. Ensure your DATABASE_URL is correctly set
2. Verify you can connect to the database: `psql $DATABASE_URL -c "SELECT 1;"`
3. Check PostgreSQL client is installed: `psql --version`
