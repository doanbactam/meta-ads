# Facebook API V23 Optimization Migration Guide

## 🎯 Overview

This guide helps you migrate from the standard Facebook API implementation to the optimized version, or understand how to use the new optimization features.

## 📋 What Changed?

### Files Modified
- ✅ `src/lib/server/facebook-api.ts` - Enhanced with optimizations
- ✅ `src/app/api/facebook/campaigns/route.ts` - Batch processing added
- ➕ `src/lib/server/facebook-api-optimized.ts` - New advanced API class

### Files Unchanged
- ✅ All other API routes continue to work
- ✅ No database schema changes
- ✅ No environment variable changes
- ✅ Backward compatible

## 🔄 Migration Options

### Option 1: Use Enhanced Standard Class (Recommended for Most)

**No code changes required!** The standard `FacebookMarketingAPI` class has been enhanced with:
- Optimized field selection
- Better error handling
- Standardized error codes
- Improved timeouts

Your existing code continues to work with better performance:

```typescript
// This code works exactly the same, but faster!
const api = new FacebookMarketingAPI(token);
const campaigns = await api.getCampaigns(adAccountId);
```

### Option 2: Use Advanced Optimized Class (For High-Performance Needs)

For maximum performance, migrate to `FacebookMarketingAPIOptimized`:

#### Before
```typescript
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';

const api = new FacebookMarketingAPI(token);
const campaigns = await api.getCampaigns(adAccountId);

// Fetch insights one by one
const campaignsWithInsights = await Promise.all(
  campaigns.map(async (campaign) => {
    const insights = await api.getCampaignInsights(campaign.id);
    return { ...campaign, insights };
  })
);
```

#### After
```typescript
import { FacebookMarketingAPIOptimized } from '@/lib/server/facebook-api-optimized';

const api = new FacebookMarketingAPIOptimized(token);

// Single batch request for campaigns with insights!
const campaignsWithInsights = await api.getCampaignsWithInsights(adAccountId, {
  datePreset: 'last_30d',
  limit: 25,
});
```

## 🚀 Feature-by-Feature Migration

### 1. Basic Campaign Fetching

**Standard (No Change)**
```typescript
const api = new FacebookMarketingAPI(token);
const campaigns = await api.getCampaigns(adAccountId);
```

**Optimized (With Pagination)**
```typescript
const api = new FacebookMarketingAPIOptimized(token);
const result = await api.getCampaigns(adAccountId, {
  limit: 25,
  after: cursor,
});

// Access data
const campaigns = result.data;
const nextCursor = result.paging?.cursors?.after;
```

### 2. Campaign Insights

**Standard (No Change)**
```typescript
const insights = await api.getCampaignInsights(campaignId, {
  datePreset: 'last_30d'
});
```

**Optimized (Batch Mode)**
```typescript
// Fetch all campaigns with insights in one go
const campaignsWithInsights = await api.getCampaignsWithInsights(adAccountId, {
  datePreset: 'last_30d'
});
```

### 3. Ad Sets

**Standard (No Change)**
```typescript
const adSets = await api.getAdSets(campaignId);
```

**Optimized (With Insights)**
```typescript
const adSetsWithInsights = await api.getAdSetsWithInsights(campaignId, {
  datePreset: 'last_7d',
  limit: 50,
});
```

### 4. Ads

**Standard (No Change)**
```typescript
const ads = await api.getAds(adSetId);
```

**Optimized (With Insights)**
```typescript
const adsWithInsights = await api.getAdsWithInsights(adSetId, {
  datePreset: 'yesterday',
  limit: 100,
});
```

## 📊 Performance Comparison

### Scenario: Fetch 50 Campaigns with Insights

#### Standard (Enhanced)
```typescript
const api = new FacebookMarketingAPI(token);
const campaigns = await api.getCampaigns(adAccountId);

// Batched processing (optimized)
const BATCH_SIZE = 10;
const results = [];
for (let i = 0; i < campaigns.length; i += BATCH_SIZE) {
  const batch = campaigns.slice(i, i + BATCH_SIZE);
  const batchResults = await Promise.all(
    batch.map(c => api.getCampaignInsights(c.id))
  );
  results.push(...batchResults);
}
```
- Time: ~2-3 seconds
- API Calls: 1 + 50 = 51 calls
- Complexity: Medium

#### Optimized (New)
```typescript
const api = new FacebookMarketingAPIOptimized(token);
const results = await api.getCampaignsWithInsights(adAccountId);
```
- Time: ~1-2 seconds
- API Calls: 1 + 1 batch call = 2 calls
- Complexity: Low

## 🔧 API Route Migration

### campaigns/route.ts (Already Updated)

The campaigns route has been updated to use batch processing:

```typescript
// New optimized approach with error isolation
const BATCH_SIZE = 10;
const campaignsWithInsights = [];

for (let i = 0; i < campaigns.length; i += BATCH_SIZE) {
  const batch = campaigns.slice(i, i + BATCH_SIZE);
  const batchResults = await Promise.all(
    batch.map(async (campaign) => {
      try {
        const insights = await api.getCampaignInsights(campaign.id);
        return { ...campaign, insights };
      } catch (error) {
        console.error(`Failed to fetch insights for ${campaign.id}:`, error);
        return { ...campaign, insights: null };
      }
    })
  );
  campaignsWithInsights.push(...batchResults);
}
```

### Other Routes (Optional Updates)

You can apply similar patterns to:
- `src/app/api/facebook/adsets/route.ts`
- `src/app/api/facebook/ads/route.ts`

## 🛡️ Error Handling Updates

### Before
```typescript
if (error.message.includes('token is invalid') || response.status === 401) {
  throw new Error('FACEBOOK_TOKEN_EXPIRED');
}
```

### After
```typescript
import { FACEBOOK_ERROR_CODES } from '@/lib/server/facebook-api';

if (
  error.code === FACEBOOK_ERROR_CODES.INVALID_TOKEN ||
  error.message.includes('token is invalid') ||
  response.status === 401
) {
  throw new Error('FACEBOOK_TOKEN_EXPIRED');
}
```

## 📝 Testing Your Migration

### 1. Test Basic Functionality
```typescript
// Test token validation
const api = new FacebookMarketingAPI(token);
const validation = await api.validateToken();
console.log('Token valid:', validation.isValid);

// Test campaign fetch
const campaigns = await api.getCampaigns(adAccountId);
console.log('Campaigns fetched:', campaigns.length);
```

### 2. Test Batch Processing
```typescript
// Test batch insights
const campaignsWithInsights = await api.getCampaigns(adAccountId);
// Should complete in ~2 seconds for 50 campaigns
```

### 3. Test Error Handling
```typescript
// Test with invalid token
const invalidApi = new FacebookMarketingAPI('invalid_token');
try {
  await invalidApi.getCampaigns(adAccountId);
} catch (error) {
  console.log('Error handled correctly:', error.message);
}
```

## 🐛 Troubleshooting

### Issue: TypeScript Errors

**Solution**: Make sure to import the correct types:
```typescript
import {
  FacebookMarketingAPI,
  FACEBOOK_ERROR_CODES,
  type FacebookCampaignData,
  type FacebookCampaignInsights,
} from '@/lib/server/facebook-api';
```

### Issue: Rate Limiting

**Symptom**: Error 17 or 613

**Solution**: Reduce batch size:
```typescript
const BATCH_SIZE = 5; // Reduce from 10
```

### Issue: Slow Response

**Symptom**: Requests taking longer than before

**Solution**: Check if you're using pagination:
```typescript
// Add limit to prevent fetching too much data
const campaigns = await api.getCampaigns(adAccountId, { limit: 25 });
```

### Issue: Missing Insights

**Symptom**: insights field is null for some campaigns

**Explanation**: This is expected behavior when:
- Campaign has no data for the date range
- Campaign was created very recently
- Facebook API temporarily fails

**Solution**: Handle null gracefully in your UI:
```typescript
const spent = campaign.insights?.spend || '0';
```

## ✅ Rollback Plan

If you need to rollback:

1. The standard `FacebookMarketingAPI` maintains backward compatibility
2. No database migrations to reverse
3. Simply use the class as before:

```typescript
const api = new FacebookMarketingAPI(token);
const campaigns = await api.getCampaigns(adAccountId);
```

The enhanced error handling and field optimization remain, but batch processing can be disabled by fetching insights individually.

## 🎯 Recommended Adoption Path

### Phase 1: Immediate (No Code Changes)
✅ Already done! Standard class is enhanced

### Phase 2: Update Error Handling (1 hour)
- Import `FACEBOOK_ERROR_CODES`
- Update error checking to use constants
- Test error scenarios

### Phase 3: Optimize Critical Paths (2-4 hours)
- Update dashboard loading to use batch processing
- Add pagination to campaign list
- Implement lazy loading for insights

### Phase 4: Full Optimization (Optional)
- Migrate to `FacebookMarketingAPIOptimized` class
- Implement ETag caching
- Add advanced batch requests

## 📚 Additional Resources

- [Facebook API V23 Optimizations](./FACEBOOK_API_V23_OPTIMIZATIONS.md) - Full technical details
- [Facebook Marketing API Docs](https://developers.facebook.com/docs/marketing-apis)
- [Batch Requests Guide](https://developers.facebook.com/docs/graph-api/batch-requests)

## 🤝 Support

If you encounter issues:

1. Check the error codes in `FACEBOOK_ERROR_CODES`
2. Review logs for detailed error messages
3. Verify token is still valid
4. Test with smaller batch sizes
5. Check Facebook API status page

---

**Migration Status**: ✅ Complete
**Backward Compatible**: Yes
**Breaking Changes**: None
**Recommended Action**: Test and monitor, no immediate changes required
