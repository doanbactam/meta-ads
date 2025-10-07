# API Routes

REST API endpoints cho ứng dụng.

## Cấu trúc

```
api/
├── _lib/                  # Shared utilities
├── ad-accounts/           # Ad account endpoints
├── ad-sets/               # Ad set endpoints
├── ads/                   # Ad endpoints
├── ai/                    # AI analysis endpoints
├── campaigns/             # Campaign endpoints
├── cron/                  # Cron job endpoints
├── demo/                  # Demo data endpoints
├── facebook/              # Facebook API endpoints
├── sync/                  # Data sync endpoints
├── user/                  # User settings endpoints
└── webhooks/              # Webhook handlers
```

## Endpoints

### Ad Accounts (`/api/ad-accounts`)

**List ad accounts**
```
GET /api/ad-accounts
Response: AdAccount[]
```

**Get ad account**
```
GET /api/ad-accounts/[id]
Response: AdAccount
```

**Get ad account stats**
```
GET /api/ad-accounts/[id]/stats
Response: { spend, impressions, clicks, ctr, conversions }
```

**Get ad account overview**
```
GET /api/ad-accounts/[id]/overview
Response: { currentPeriod, previousPeriod, changes }
```

**Get daily stats**
```
GET /api/ad-accounts/[id]/daily-stats
Response: DailyStats[]
```

**Get top campaigns**
```
GET /api/ad-accounts/[id]/top-campaigns
Response: Campaign[]
```

**Get account status**
```
GET /api/ad-accounts/[id]/status
Response: { status, lastSynced, syncStatus }
```

### Campaigns (`/api/campaigns`)

**List campaigns**
```
GET /api/campaigns?adAccountId=xxx
Response: Campaign[]
```

**Create campaign**
```
POST /api/campaigns
Body: CampaignCreateInput
Response: Campaign
```

**Get campaign**
```
GET /api/campaigns/[id]
Response: Campaign
```

**Update campaign**
```
PATCH /api/campaigns/[id]
Body: CampaignUpdateInput
Response: Campaign
```

**Delete campaign**
```
DELETE /api/campaigns/[id]
Response: { success: true }
```

**Duplicate campaign**
```
POST /api/campaigns/[id]/duplicate
Response: Campaign
```

### Ad Sets (`/api/ad-sets`)

**List ad sets**
```
GET /api/ad-sets?adAccountId=xxx
Response: AdSet[]
```

**Create ad set**
```
POST /api/ad-sets
Body: AdSetCreateInput
Response: AdSet
```

**Get ad set**
```
GET /api/ad-sets/[id]
Response: AdSet
```

**Update ad set**
```
PATCH /api/ad-sets/[id]
Body: AdSetUpdateInput
Response: AdSet
```

**Delete ad set**
```
DELETE /api/ad-sets/[id]
Response: { success: true }
```

**Duplicate ad set**
```
POST /api/ad-sets/[id]/duplicate
Response: AdSet
```

### Ads (`/api/ads`)

**List ads**
```
GET /api/ads?adAccountId=xxx
Response: Ad[]
```

**Create ad**
```
POST /api/ads
Body: AdCreateInput
Response: Ad
```

**Get ad**
```
GET /api/ads/[id]
Response: Ad
```

**Update ad**
```
PATCH /api/ads/[id]
Body: AdUpdateInput
Response: Ad
```

**Delete ad**
```
DELETE /api/ads/[id]
Response: { success: true }
```

**Duplicate ad**
```
POST /api/ads/[id]/duplicate
Response: Ad
```

### Facebook Integration (`/api/facebook`)

**Connect Facebook account**
```
POST /api/facebook/connect
Body: { code, redirectUri }
Response: { success, adAccounts }
```

**Check connection status**
```
GET /api/facebook/check-connection?adAccountId=xxx
Response: { connected, valid, expiresAt }
```

**Validate token**
```
POST /api/facebook/validate-token
Body: { adAccountId }
Response: { valid, expiresAt }
```

**Sync Facebook data**
```
POST /api/facebook/sync
Body: { adAccountId }
Response: { success, synced }
```

**Get Facebook campaigns**
```
GET /api/facebook/campaigns?adAccountId=xxx
Response: FacebookCampaign[]
```

**Get Facebook ad sets**
```
GET /api/facebook/adsets?adAccountId=xxx&campaignId=xxx
Response: FacebookAdSet[]
```

**Get Facebook ads**
```
GET /api/facebook/ads?adAccountId=xxx&adSetId=xxx
Response: FacebookAd[]
```

### AI Analysis (`/api/ai`)

**Analyze campaign**
```
POST /api/ai/analyze
Body: { campaignId }
Response: { analysis: AIAnalysisResult }
```

### Sync (`/api/sync`)

**Trigger manual sync**
```
POST /api/sync
Body: { adAccountId }
Response: { success, message }
```

### User Settings (`/api/user`)

**Get user settings**
```
GET /api/user/settings
Response: UserSettings
```

**Update user settings**
```
PATCH /api/user/settings
Body: UserSettingsUpdate
Response: UserSettings
```

### Cron Jobs (`/api/cron`)

**Refresh tokens**
```
POST /api/cron/refresh-tokens
Headers: { Authorization: Bearer CRON_SECRET }
Response: { refreshed, errors }
```

**Sync Facebook data**
```
POST /api/cron/sync-facebook
Headers: { Authorization: Bearer CRON_SECRET }
Response: { synced, errors }
```

### Webhooks (`/api/webhooks`)

**Facebook webhook**
```
GET /api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=xxx
Response: hub.challenge

POST /api/webhooks/facebook
Body: FacebookWebhookPayload
Response: { received: true }
```

### Demo (`/api/demo`)

**Get demo data**
```
GET /api/demo/data
Response: { campaigns, adSets, ads }
```

**Seed demo data**
```
POST /api/demo/seed
Response: { success, created }
```

**Clear demo data**
```
DELETE /api/demo/clear
Response: { success, deleted }
```

## Authentication

Tất cả endpoints (trừ webhooks và cron) yêu cầu authentication qua Clerk:

```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

## Rate Limiting

API routes được rate limit để tránh abuse:

```typescript
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/app/api/_lib/rate-limiter';

const rateLimitResult = checkRateLimit(userId, 'facebook_api');
if (!rateLimitResult.allowed) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429 }
  );
}
```

## Error Handling

Tất cả endpoints trả về consistent error format:

```json
{
  "error": "Error message",
  "details": "Optional detailed error message"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Request/Response Examples

### Create Campaign

**Request:**
```bash
POST /api/campaigns
Content-Type: application/json

{
  "adAccountId": "xxx",
  "name": "Summer Sale 2025",
  "status": "ACTIVE",
  "budget": 1000,
  "date_start": "2025-06-01",
  "date_end": "2025-08-31"
}
```

**Response:**
```json
{
  "id": "yyy",
  "name": "Summer Sale 2025",
  "status": "ACTIVE",
  "budget": 1000,
  "spent": 0,
  "impressions": 0,
  "clicks": 0,
  "ctr": 0,
  "conversions": 0,
  "cost_per_conversion": 0,
  "date_start": "2025-06-01",
  "date_end": "2025-08-31",
  "created_at": "2025-10-07T...",
  "updated_at": "2025-10-07T..."
}
```

### Get Campaign Stats

**Request:**
```bash
GET /api/ad-accounts/xxx/stats
```

**Response:**
```json
{
  "spend": 1234.56,
  "impressions": 50000,
  "clicks": 1500,
  "ctr": 3.0,
  "conversions": 150,
  "cost_per_conversion": 8.23
}
```

## Testing

### Manual Testing

```bash
# Get campaigns
curl http://localhost:3000/api/campaigns?adAccountId=xxx \
  -H "Cookie: __session=..."

# Create campaign
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=..." \
  -d '{"adAccountId":"xxx","name":"Test","status":"ACTIVE","budget":1000}'
```

### Integration Tests

```typescript
import { POST } from '@/app/api/campaigns/route';

describe('POST /api/campaigns', () => {
  it('creates campaign', async () => {
    const request = new Request('http://localhost/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        adAccountId: 'xxx',
        name: 'Test',
        status: 'ACTIVE',
        budget: 1000,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe('Test');
  });
});
```

## Best Practices

### 1. Use TypeScript

```typescript
import { type NextRequest, NextResponse } from 'next/server';

interface CreateCampaignBody {
  adAccountId: string;
  name: string;
  status: string;
  budget: number;
}

export async function POST(request: NextRequest) {
  const body: CreateCampaignBody = await request.json();
  // ...
}
```

### 2. Validate Input

```typescript
import { z } from 'zod';

const CreateCampaignSchema = z.object({
  adAccountId: z.string(),
  name: z.string().min(1).max(100),
  status: z.enum(['ACTIVE', 'PAUSED']),
  budget: z.number().positive(),
});

const body = CreateCampaignSchema.parse(await request.json());
```

### 3. Handle Errors

```typescript
try {
  // API logic
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### 4. Use Server Actions When Possible

For mutations, consider using Server Actions instead of API routes:

```typescript
// actions/campaigns.ts
'use server';

export async function createCampaign(data: CreateCampaignInput) {
  // Direct database access, no HTTP overhead
  return await prisma.campaign.create({ data });
}
```

## Related Documentation

- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Clerk Authentication](https://clerk.com/docs)
- [Facebook Marketing API](https://developers.facebook.com/docs/marketing-apis)
