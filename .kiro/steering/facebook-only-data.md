---
inclusion: manual
---

# Facebook-Only Data Strategy

This document outlines the transition from seed data to Facebook API-only data approach.

## Overview

The application now exclusively uses Facebook Marketing API for campaign data instead of storing campaigns in the local database. This provides real-time, accurate data directly from Facebook.

## Key Changes

### 1. Data Source
- **Before**: Local database with seed data + Facebook API sync
- **After**: Direct Facebook API calls only

### 2. API Endpoints Updated

#### `/api/campaigns`
- Now fetches directly from Facebook Marketing API
- Maps Facebook campaign data to internal format
- Handles Facebook connection status
- Returns empty array if Facebook not connected

#### `/api/ad-accounts/[id]/stats`
- Calculates stats from Facebook API data
- Real-time metrics from Facebook insights
- Falls back to empty stats if API fails

### 3. Removed Components
- Sample campaigns creation
- Database campaign storage
- Seed data dependencies

## Benefits

### ✅ Real-Time Data
- Always up-to-date campaign information
- Live metrics from Facebook
- No sync delays or inconsistencies

### ✅ Simplified Architecture
- No database campaign storage
- Reduced data duplication
- Single source of truth (Facebook)

### ✅ Better Performance
- No database queries for campaigns
- Direct API calls are faster
- Reduced server load

### ✅ Accurate Metrics
- Real Facebook spend data
- Live impression/click counts
- Actual campaign status

## Facebook API Integration

### Campaign Data Mapping
```typescript
Facebook Campaign -> Internal Format
{
  id: campaign.id,
  name: campaign.name,
  status: mapFacebookStatus(campaign.status),
  budget: parseFloat(campaign.lifetimeBudget || campaign.dailyBudget || '0') / 100,
  spent: parseFloat(insights?.spend || '0'),
  impressions: parseInt(insights?.impressions || '0'),
  clicks: parseInt(insights?.clicks || '0'),
  ctr: parseFloat(insights?.ctr || '0'),
  // ... other fields
}
```

### Status Mapping
- `ACTIVE` → `Eligible`
- `PAUSED` → `Paused`
- `DELETED` → `Removed`
- `ARCHIVED` → `Ended`

## Error Handling

### Connection States
1. **Not Connected**: Shows "Connect Facebook" button
2. **Token Expired**: Shows reconnection message
3. **API Error**: Shows error message with retry option
4. **No Campaigns**: Shows "No campaigns found" message

### Fallback Behavior
- Empty arrays for failed API calls
- Graceful error messages
- Retry mechanisms for network issues

## User Experience

### Loading States
- Shows loading indicator while fetching from Facebook
- Real-time refresh capability
- Clear connection status indicators

### Empty States
- Different messages based on connection status
- Action buttons for connection/refresh
- Clear guidance for users

## Technical Implementation

### API Rate Limiting
- Facebook API rate limits respected
- Exponential backoff for retries
- Timeout handling (15s)

### Caching Strategy
- React Query caching (5 minutes stale time)
- Manual refresh capability
- Automatic refetch on connection changes

### Security
- Token validation before API calls
- User access verification
- Secure token storage

## Migration Notes

### Database Cleanup
- All seed campaigns removed
- Demo user and accounts deleted
- Only real user accounts remain

### Backward Compatibility
- Old campaign functions deprecated but maintained
- Graceful fallbacks for missing data
- No breaking changes to UI components

## Future Enhancements

### Planned Features
1. **Real-time Updates**: WebSocket connections for live data
2. **Bulk Operations**: Facebook API bulk campaign management
3. **Advanced Insights**: More detailed Facebook metrics
4. **Caching Layer**: Redis for improved performance

### Considerations
- Facebook API quotas and limits
- Data freshness vs. performance trade-offs
- Offline capability for critical operations

## Monitoring

### Key Metrics
- Facebook API response times
- Error rates and types
- User connection success rates
- Data freshness indicators

### Alerts
- Facebook API failures
- Token expiration warnings
- Rate limit approaching
- Connection issues

This approach ensures users always see their actual Facebook campaign data in real-time while maintaining a clean, performant application architecture.