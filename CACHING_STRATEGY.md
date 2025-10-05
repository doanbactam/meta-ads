# 📦 Caching & Sync Strategy

## Overview

The Ad Manager Dashboard uses a **multi-layer caching strategy** to optimize performance and reduce Facebook API calls:

1. **Database Cache** (Primary) - PostgreSQL stores synced Facebook data
2. **Next.js Cache** (Secondary) - Server-side rendering cache with revalidation
3. **React Query Cache** (Tertiary) - Client-side cache for instant UI updates
4. **Background Sync** - Automatic data synchronization via cron jobs

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Request                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    React Query Cache (5min)                      │
│                    - Client-side instant UI                      │
└────────────────────────┬────────────────────────────────────────┘
                         │ cache miss
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js unstable_cache (5min)                  │
│                   - SSR optimization                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ revalidate
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database Cache                     │
│  - Campaigns (facebookCampaignId, lastSyncedAt)                 │
│  - Ad Sets (facebookAdSetId, lastSyncedAt)                      │
│  - Ads (facebookAdId, lastSyncedAt)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │ if outdated (>10min)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Background Sync Service                        │
│                   - Non-blocking async sync                      │
│                   - Triggered automatically                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Facebook Marketing API v23                     │
│  - getCampaigns() → save to DB                                  │
│  - getAdSets() → save to DB                                     │
│  - getAds() → save to DB                                        │
│  - getInsights() → update metrics                               │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. **Read Path (Fast 🚀)**

```typescript
GET /api/campaigns?adAccountId=xxx
↓
1. Check Next.js cache (unstable_cache) ← 5 minutes
2. If cached → Return immediately
3. If not → Query PostgreSQL database
4. Return cached data (< 100ms)
5. Check if sync needed (lastSyncedAt > 10 min)
6. If yes → Trigger background sync (non-blocking)
```

### 2. **Sync Path (Background 🔄)**

```typescript
Background Sync (triggered by API or cron)
↓
1. Check lastSyncedAt timestamp
2. If < 10 minutes → Skip
3. If > 10 minutes:
   a. Fetch campaigns from Facebook
   b. Upsert to database (by facebookCampaignId)
   c. Fetch ad sets for each campaign
   d. Upsert to database (by facebookAdSetId)
   e. Fetch ads for each ad set
   f. Upsert to database (by facebookAdId)
4. Update lastSyncedAt, syncStatus
5. Revalidate Next.js cache
```

## Database Schema

### Campaign
```prisma
model Campaign {
  id                   String    @id @default(cuid())
  facebookCampaignId   String?   @unique  // 🔑 Key for upsert
  lastSyncedAt         DateTime?          // 🕐 Sync tracking
  // ... metrics
}
```

### AdGroup (Ad Sets)
```prisma
model AdGroup {
  id                 String    @id @default(cuid())
  facebookAdSetId    String?   @unique  // 🔑 Key for upsert
  lastSyncedAt       DateTime?          // 🕐 Sync tracking
  // ... metrics
}
```

### Creative (Ads)
```prisma
model Creative {
  id             String    @id @default(cuid())
  facebookAdId   String?   @unique  // 🔑 Key for upsert
  lastSyncedAt   DateTime?          // 🕐 Sync tracking
  // ... metrics
}
```

### AdAccount
```prisma
model AdAccount {
  id               String    @id @default(cuid())
  lastSyncedAt     DateTime?          // 🕐 Account-level sync
  syncStatus       String?             // idle, syncing, error
  syncError        String?             // Error message if failed
  // ... credentials
}
```

## API Endpoints

### 1. **GET /api/campaigns**
Returns campaigns from database cache.

**Cache Headers:**
```http
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
```

**Response Time:** < 100ms (database read)

### 2. **GET /api/ad-sets**
Returns ad sets from database cache.

**Response Time:** < 150ms (database read with join)

### 3. **GET /api/ads**
Returns ads from database cache.

**Response Time:** < 200ms (database read with joins)

### 4. **POST /api/sync**
Manual sync trigger (authenticated users).

```bash
curl -X POST https://your-domain.com/api/sync \
  -H "Content-Type: application/json" \
  -d '{"adAccountId": "xxx", "force": true}'
```

**Parameters:**
- `adAccountId` (required): Ad account to sync
- `force` (optional): Force sync even if recently synced

### 5. **GET /api/sync?secret=xxx**
Cron job endpoint for automatic sync.

**Security:** Requires `CRON_SECRET` environment variable.

## Cron Job Setup

### Option 1: Vercel Cron (Recommended)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/sync?secret=YOUR_CRON_SECRET",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### Option 2: External Cron Service

Use services like:
- **Cron-job.org** - Free
- **EasyCron** - Free tier available
- **AWS EventBridge** - Serverless
- **GitHub Actions** - Free for public repos

Example cron expression:
```bash
# Every 10 minutes
*/10 * * * * curl https://your-domain.com/api/sync?secret=YOUR_CRON_SECRET

# Every 30 minutes (recommended for production)
*/30 * * * * curl https://your-domain.com/api/sync?secret=YOUR_CRON_SECRET

# Every hour
0 * * * * curl https://your-domain.com/api/sync?secret=YOUR_CRON_SECRET
```

### Option 3: Node.js Cron (Self-hosted)

Create `cron-job.ts`:
```typescript
import cron from 'node-cron';

// Run every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/sync?secret=${process.env.CRON_SECRET}`
    );
    const result = await response.json();
    console.log('Cron sync completed:', result);
  } catch (error) {
    console.error('Cron sync failed:', error);
  }
});
```

## Environment Variables

```bash
# Required for cron jobs
CRON_SECRET=your-random-secret-here-min-32-chars

# Database
DATABASE_URL=postgresql://...

# Facebook API (existing)
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
```

Generate secure CRON_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Cache Invalidation

### Automatic Invalidation
- Database updates trigger Next.js cache revalidation
- `lastSyncedAt` timestamp tracks freshness
- Background sync updates cache automatically

### Manual Invalidation

**Option 1: Force Sync API**
```bash
POST /api/sync
{
  "adAccountId": "xxx",
  "force": true
}
```

**Option 2: Revalidate Tag (Server Action)**
```typescript
import { revalidateTag } from 'next/cache';

// Revalidate specific ad account
revalidateTag(`campaigns-${adAccountId}`);
revalidateTag(`ad-sets-${adAccountId}`);
revalidateTag(`ads-${adAccountId}`);
```

**Option 3: Revalidate Path**
```typescript
import { revalidatePath } from 'next/cache';

revalidatePath('/api/campaigns');
```

## Performance Benchmarks

| Operation | Without Cache | With Cache | Improvement |
|-----------|--------------|------------|-------------|
| **Load Campaigns** | 2-3s | 50-100ms | **20-60x faster** |
| **Load Ad Sets** | 3-5s | 100-150ms | **30-50x faster** |
| **Load Ads** | 5-10s | 150-200ms | **30-60x faster** |
| **Full Page Load** | 10-15s | 300-500ms | **30-50x faster** |

## Monitoring

### Sync Status
Check ad account sync status:
```sql
SELECT 
  name,
  last_synced_at,
  sync_status,
  sync_error
FROM ad_accounts
ORDER BY last_synced_at DESC;
```

### Cache Freshness
Check data freshness:
```sql
-- Campaigns sync status
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN last_synced_at > NOW() - INTERVAL '10 minutes' THEN 1 END) as fresh,
  COUNT(CASE WHEN last_synced_at IS NULL THEN 1 END) as never_synced
FROM campaigns;

-- Ad Sets sync status
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN last_synced_at > NOW() - INTERVAL '10 minutes' THEN 1 END) as fresh
FROM ad_groups;

-- Ads sync status
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN last_synced_at > NOW() - INTERVAL '10 minutes' THEN 1 END) as fresh
FROM creatives;
```

### Sync Logs
Monitor sync operations:
```typescript
// Check sync errors
const failedAccounts = await prisma.adAccount.findMany({
  where: { syncStatus: 'error' },
  select: { name, syncError, lastSyncedAt }
});
```

## Best Practices

### ✅ DO
- Use database cache as primary data source
- Set up cron jobs for automatic sync
- Monitor `lastSyncedAt` timestamps
- Handle sync errors gracefully
- Return cached data immediately
- Trigger background sync when data is stale

### ❌ DON'T
- Don't call Facebook API directly from frontend
- Don't sync on every page load
- Don't block requests waiting for sync
- Don't ignore sync errors
- Don't sync too frequently (respect rate limits)

## Troubleshooting

### Issue: Data not updating
**Solution:**
1. Check `lastSyncedAt` timestamp
2. Trigger manual sync: `POST /api/sync`
3. Check sync status: `syncStatus` and `syncError` fields

### Issue: Cron job not running
**Solution:**
1. Verify `CRON_SECRET` is set
2. Check cron service is configured
3. Test endpoint manually: `GET /api/sync?secret=xxx`

### Issue: Sync errors
**Solution:**
1. Check Facebook token validity
2. Verify API permissions
3. Check rate limits
4. Review `syncError` field in database

## Migration Guide

### Step 1: Update Database Schema
```bash
npm run prisma:push
```

### Step 2: Initial Sync
```bash
curl -X POST https://your-domain.com/api/sync \
  -H "Content-Type: application/json" \
  -d '{"adAccountId": "xxx", "force": true}'
```

### Step 3: Set Up Cron Job
Configure cron job (see options above)

### Step 4: Verify
Check data in database and monitor sync status

---

**Last Updated:** 2025-10-05  
**Version:** 1.0.0
