# Design Document - Facebook Logic Testing

## Overview

Design này mô tả cách xây dựng một test suite toàn diện để test chi tiết tất cả các logic Facebook integration trong Ad Manager Dashboard. Test suite sẽ bao gồm unit tests, integration tests, và E2E tests để đảm bảo mọi component hoạt động đúng trong mọi tình huống.

### Goals

- Tạo unit tests cho FacebookMarketingAPI class với mocked responses
- Tạo integration tests cho FacebookSyncService với test database
- Tạo E2E tests cho Facebook connection flow với Playwright
- Đảm bảo test coverage >= 90% cho tất cả Facebook-related code
- Test tất cả edge cases: token expiry, rate limiting, network errors, pagination loops
- Tạo test utilities và fixtures để reuse across tests

### Testing Strategy

1. **Unit Tests**: Test isolated functions và methods với mocked dependencies
2. **Integration Tests**: Test interaction giữa components với real database (test DB)
3. **E2E Tests**: Test full user flow từ UI đến API đến database
4. **Mock Strategy**: Sử dụng MSW (Mock Service Worker) cho API mocking
5. **Test Database**: Sử dụng separate test database với Prisma

## Architecture

### Test Structure


```
tests/
├── unit/
│   ├── facebook-api.test.ts           # FacebookMarketingAPI unit tests
│   ├── facebook-sync-service.test.ts  # FacebookSyncService unit tests
│   ├── facebook-connection-hook.test.ts # useFacebookConnection hook tests
│   └── facebook-utils.test.ts         # Utility functions tests
├── integration/
│   ├── facebook-api-integration.test.ts    # API integration tests
│   ├── facebook-sync-integration.test.ts   # Sync service integration tests
│   └── facebook-connection-api.test.ts     # Connection API routes tests
├── e2e/
│   └── tests/
│       └── 04-facebook-connection.spec.ts  # Existing E2E tests (enhance)
├── fixtures/
│   ├── facebook-responses.ts          # Mock Facebook API responses
│   ├── test-data.ts                   # Test database seed data
│   └── mock-tokens.ts                 # Mock access tokens
└── helpers/
    ├── facebook-test-helpers.ts       # Facebook-specific test utilities
    ├── mock-server.ts                 # MSW server setup
    └── test-db.ts                     # Test database utilities
```

### Testing Tools & Libraries

- **Vitest**: Fast unit test runner (thay thế Jest)
- **@testing-library/react**: React component testing
- **@testing-library/react-hooks**: React hooks testing
- **MSW (Mock Service Worker)**: API mocking
- **Playwright**: E2E testing (đã có)
- **Prisma Test Client**: Isolated test database


## Components and Interfaces

### 1. FacebookMarketingAPI Unit Tests

**File**: `tests/unit/facebook-api.test.ts`

**Test Cases**:

```typescript
describe('FacebookMarketingAPI', () => {
  describe('validateToken', () => {
    test('should return valid token info when token is valid')
    test('should return invalid when token expired')
    test('should retry on network timeout')
    test('should extract business IDs from granular scopes')
    test('should handle malformed API response')
  })

  describe('getBusinessAdAccounts', () => {
    test('should fetch both owned and client accounts')
    test('should deduplicate accounts by ID')
    test('should continue when client accounts fail')
    test('should map account fields correctly')
  })

  describe('getCampaigns', () => {
    test('should fetch all pages with pagination')
    test('should detect and abort pagination loops')
    test('should use cache when available')
    test('should handle rate limiting with retry')
    test('should throw FacebookTokenExpiredError on 401')
  })

  describe('getCampaignInsights', () => {
    test('should format date range correctly')
    test('should use date preset when provided')
    test('should return null when no data')
    test('should cache results with correct TTL')
    test('should parse metrics correctly')
  })

  describe('fetchAllPages', () => {
    test('should fetch all pages until no next URL')
    test('should respect max pages limit')
    test('should apply rate limiting')
    test('should handle rate limit errors with exponential backoff')
    test('should detect visited URLs to prevent loops')
  })
})
```

**Mocking Strategy**:
- Mock `fetch` global function với `vi.fn()`
- Mock rate limiters: `appRateLimiter`, `adAccountRateLimiter`
- Mock caches: `insightsCache`, `entityCache`, `accountCache`


### 2. FacebookSyncService Unit Tests

**File**: `tests/unit/facebook-sync-service.test.ts`

**Test Cases**:

```typescript
describe('FacebookSyncService', () => {
  describe('syncAll', () => {
    test('should skip sync when recently synced (< 10 min)')
    test('should force sync when force=true')
    test('should update syncStatus to SYNCING before sync')
    test('should sync campaigns, ad sets, and ads in order')
    test('should update syncStatus to IDLE on success')
    test('should update syncStatus to ERROR on failure')
    test('should collect errors from all sync operations')
  })

  describe('syncCampaigns', () => {
    test('should fetch campaigns and insights')
    test('should upsert campaigns to database')
    test('should convert budget from cents to dollars')
    test('should map Facebook status to Prisma enum')
    test('should continue on individual campaign error')
    test('should update lastSyncedAt timestamp')
  })

  describe('syncAdSets', () => {
    test('should fetch ad sets for all campaigns')
    test('should create relationships with campaigns')
    test('should handle missing insights gracefully')
    test('should skip campaigns without facebookCampaignId')
  })

  describe('syncAds', () => {
    test('should fetch ads for all ad sets')
    test('should create relationships with ad sets')
    test('should map ad status to creative status')
    test('should handle missing creative data')
  })
})

describe('syncAllAdAccounts', () => {
  test('should find accounts needing sync')
  test('should skip accounts synced recently')
  test('should sync multiple accounts in sequence')
  test('should collect errors from all accounts')
})
```

**Mocking Strategy**:
- Mock `FacebookMarketingAPI` methods
- Mock `prisma` client với `vi.mock()`
- Use in-memory test database hoặc mock Prisma calls


### 3. useFacebookConnection Hook Tests

**File**: `tests/unit/facebook-connection-hook.test.ts`

**Test Cases**:

```typescript
describe('useFacebookConnection', () => {
  test('should fetch connection status on mount')
  test('should return connected=true when connected')
  test('should return connected=false when not connected')
  test('should set requiresReconnect on token expiry')
  test('should use cached data within stale time')
  test('should refetch after stale time')
  
  describe('connectFacebook', () => {
    test('should call connect API with access token')
    test('should invalidate all related queries on success')
    test('should update store state on success')
    test('should close dialog on success')
    test('should return error on failure')
    test('should set connected=false on error')
  })

  describe('checkConnection', () => {
    test('should return connected status from API')
    test('should handle API errors gracefully')
    test('should return requiresReconnect on token expiry')
    test('should parse token expiry date correctly')
  })
})
```

**Mocking Strategy**:
- Mock `fetch` cho API calls
- Mock `@tanstack/react-query` với `QueryClient`
- Mock `useFacebookStore` với `vi.mock()`
- Use `renderHook` từ `@testing-library/react-hooks`

### 4. Integration Tests

**File**: `tests/integration/facebook-api-integration.test.ts`

**Test Cases**:

```typescript
describe('Facebook API Integration', () => {
  test('should validate real token format')
  test('should handle Facebook API error responses')
  test('should respect rate limiting in real scenarios')
  test('should handle pagination with real-like responses')
  test('should cache and retrieve from cache correctly')
})
```

**Setup**:
- Use MSW để mock Facebook Graph API endpoints
- Simulate real Facebook API responses với delays
- Test rate limiting behavior với multiple concurrent requests


**File**: `tests/integration/facebook-sync-integration.test.ts`

**Test Cases**:

```typescript
describe('Facebook Sync Integration', () => {
  beforeEach(async () => {
    // Setup test database
    await setupTestDatabase()
  })

  afterEach(async () => {
    // Cleanup test database
    await cleanupTestDatabase()
  })

  test('should sync campaigns to database')
  test('should create relationships between campaigns and ad sets')
  test('should update existing campaigns on re-sync')
  test('should handle partial sync failures')
  test('should maintain data integrity on errors')
})
```

**Setup**:
- Use separate test database với Prisma
- Seed test data trước mỗi test
- Cleanup sau mỗi test để isolation

### 5. E2E Tests Enhancement

**File**: `e2e/tests/04-facebook-connection.spec.ts` (enhance existing)

**Additional Test Cases**:

```typescript
describe('Facebook Connection E2E', () => {
  test('should handle token expiry during campaign fetch')
  test('should show reconnect prompt when token expires')
  test('should successfully reconnect and resume')
  test('should sync all accounts after OAuth')
  test('should display sync progress indicator')
  test('should handle network errors gracefully')
  test('should retry failed syncs automatically')
})
```

## Data Models

### Test Fixtures Structure

**facebook-responses.ts**:

```typescript
export const mockValidTokenResponse = {
  data: {
    is_valid: true,
    app_id: '123456789',
    user_id: '987654321',
    expires_at: Date.now() + 86400000, // 24h from now
    scopes: ['ads_management', 'ads_read'],
    granular_scopes: [
      {
        scope: 'ads_management',
        target_ids: ['business_123', 'business_456']
      }
    ]
  }
}

export const mockExpiredTokenResponse = {
  error: {
    message: 'Session has expired',
    code: 190,
    type: 'OAuthException'
  }
}

export const mockCampaignsResponse = {
  data: [
    {
      id: '123456789',
      name: 'Test Campaign',
      status: 'ACTIVE',
      objective: 'CONVERSIONS',
      daily_budget: '5000', // cents
      lifetime_budget: null
    }
  ],
  paging: {
    next: 'https://graph.facebook.com/v23.0/...'
  }
}

export const mockInsightsResponse = {
  data: [
    {
      impressions: '10000',
      clicks: '500',
      spend: '2500', // cents
      reach: '8000',
      ctr: '5.0',
      cpc: '5.0',
      cpm: '2.5'
    }
  ]
}
```


**test-data.ts**:

```typescript
export const testUser = {
  id: 'test-user-1',
  clerkUserId: 'clerk_test_123',
  email: 'test@example.com',
  role: 'USER' as const
}

export const testAdAccount = {
  id: 'test-account-1',
  userId: 'test-user-1',
  name: 'Test Ad Account',
  platform: 'FACEBOOK' as const,
  facebookAdAccountId: 'act_123456789',
  facebookAccessToken: 'test_token_123',
  lastSyncedAt: null,
  syncStatus: 'IDLE' as const
}

export const testCampaign = {
  id: 'test-campaign-1',
  adAccountId: 'test-account-1',
  facebookCampaignId: '123456789',
  name: 'Test Campaign',
  status: 'ACTIVE' as const,
  budget: 50.00, // dollars
  spent: 25.00,
  impressions: 10000,
  clicks: 500,
  ctr: 5.0
}
```

## Error Handling

### Error Types and Handling Strategy

1. **FacebookTokenExpiredError**
   - Throw custom error class
   - Propagate to UI layer
   - Trigger reconnection flow
   - Test: Mock 401 response và verify error thrown

2. **Rate Limit Errors**
   - Implement exponential backoff
   - Max 4 retries
   - Add jitter to prevent thundering herd
   - Test: Mock 429 response và verify retry logic

3. **Network Errors**
   - Timeout after 30s
   - Return user-friendly message
   - Don't expose internal errors
   - Test: Mock timeout và verify error message

4. **Pagination Loop Errors**
   - Detect visited URLs
   - Abort pagination
   - Log warning
   - Test: Mock circular pagination và verify abort

5. **Partial Sync Errors**
   - Continue with remaining items
   - Collect all errors
   - Update sync status with errors
   - Test: Mock mixed success/failure và verify behavior


## Testing Strategy

### Unit Testing Approach

**Isolation**: Mỗi test case phải isolated, không depend vào external services

**Mocking**: 
- Mock tất cả external dependencies (fetch, prisma, rate limiters)
- Use `vi.fn()` để create mock functions
- Use `vi.mock()` để mock entire modules

**Assertions**:
- Verify function return values
- Verify mock function calls (times, arguments)
- Verify error throwing
- Verify state changes

**Example Unit Test**:

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { FacebookMarketingAPI } from '@/lib/server/facebook-api'

describe('FacebookMarketingAPI.validateToken', () => {
  let api: FacebookMarketingAPI
  
  beforeEach(() => {
    api = new FacebookMarketingAPI('test_token')
    vi.clearAllMocks()
  })

  test('should return valid token info when token is valid', async () => {
    // Arrange
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockValidTokenResponse
    })

    // Act
    const result = await api.validateToken()

    // Assert
    expect(result.isValid).toBe(true)
    expect(result.appId).toBe('123456789')
    expect(result.businessIds).toEqual(['business_123', 'business_456'])
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  test('should retry on network timeout', async () => {
    // Arrange
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidTokenResponse
      })

    // Act
    const result = await api.validateToken()

    // Assert
    expect(result.isValid).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
```

### Integration Testing Approach

**Real Dependencies**: Use real database, real cache, nhưng mock external APIs

**MSW Setup**:

```typescript
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const handlers = [
  http.get('https://graph.facebook.com/v23.0/debug_token', () => {
    return HttpResponse.json(mockValidTokenResponse)
  }),
  
  http.get('https://graph.facebook.com/v23.0/act_*/campaigns', () => {
    return HttpResponse.json(mockCampaignsResponse)
  })
]

export const server = setupServer(...handlers)
```

**Database Setup**:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL
    }
  }
})

export async function setupTestDatabase() {
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`
  await prisma.user.create({ data: testUser })
  await prisma.adAccount.create({ data: testAdAccount })
}

export async function cleanupTestDatabase() {
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`
}
```


### E2E Testing Approach

**Real Browser**: Use Playwright với real browser instances

**API Mocking**: Mock Facebook OAuth và API responses

**Database**: Use test database với seeded data

**Example E2E Test**:

```typescript
import { test, expect } from '@playwright/test'

test('should connect Facebook and sync campaigns', async ({ page }) => {
  // Mock Facebook OAuth
  await page.route('https://www.facebook.com/v23.0/dialog/oauth*', route => {
    route.fulfill({
      status: 302,
      headers: {
        'Location': 'http://localhost:3000/api/auth/facebook/callback?code=test_code'
      }
    })
  })

  // Mock Facebook API
  await page.route('https://graph.facebook.com/**', route => {
    const url = route.request().url()
    if (url.includes('debug_token')) {
      route.fulfill({ json: mockValidTokenResponse })
    } else if (url.includes('campaigns')) {
      route.fulfill({ json: mockCampaignsResponse })
    }
  })

  // Navigate to campaigns page
  await page.goto('/campaigns')

  // Click connect button
  await page.click('button:has-text("Connect Facebook")')

  // Click login button in dialog
  await page.click('button:has-text("Login with Facebook")')

  // Wait for sync to complete
  await page.waitForSelector('text=Test Campaign')

  // Verify campaign is displayed
  expect(await page.textContent('text=Test Campaign')).toBeTruthy()
})
```

## Test Coverage Goals

### Coverage Targets

- **Overall Coverage**: >= 90%
- **FacebookMarketingAPI**: >= 95%
- **FacebookSyncService**: >= 90%
- **useFacebookConnection**: >= 85%
- **API Routes**: >= 80%

### Coverage Reporting

```bash
# Run tests with coverage
bun run test:coverage

# Generate HTML report
bun run test:coverage:html

# View coverage report
open coverage/index.html
```

### Critical Paths to Cover

1. Token validation flow (100%)
2. Pagination logic (100%)
3. Rate limiting and retry logic (100%)
4. Error handling and recovery (100%)
5. Data mapping and transformation (95%)
6. Sync service orchestration (90%)
7. Connection status management (85%)


## Implementation Plan

### Phase 1: Setup Test Infrastructure

1. Install Vitest và testing libraries
2. Configure Vitest với TypeScript
3. Setup MSW server
4. Create test database configuration
5. Create test fixtures và helpers

### Phase 2: Unit Tests

1. FacebookMarketingAPI unit tests
   - Token validation tests
   - Ad accounts fetching tests
   - Campaigns/AdSets/Ads fetching tests
   - Insights fetching tests
   - Pagination tests
   - Rate limiting tests

2. FacebookSyncService unit tests
   - Sync orchestration tests
   - Campaign sync tests
   - Ad set sync tests
   - Ad sync tests
   - Error handling tests

3. useFacebookConnection hook tests
   - Connection status tests
   - Connect flow tests
   - Query invalidation tests

### Phase 3: Integration Tests

1. Facebook API integration tests
   - End-to-end API flow tests
   - Rate limiting behavior tests
   - Cache behavior tests

2. Sync service integration tests
   - Database integration tests
   - Full sync flow tests
   - Error recovery tests

### Phase 4: E2E Tests Enhancement

1. Enhance existing E2E tests
2. Add token expiry scenarios
3. Add sync progress scenarios
4. Add error handling scenarios

### Phase 5: Coverage and Optimization

1. Measure test coverage
2. Add tests for uncovered paths
3. Optimize slow tests
4. Document test patterns

## Configuration Files

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### tests/setup.ts

```typescript
import { beforeAll, afterAll, afterEach } from 'vitest'
import { server } from './helpers/mock-server'

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
})

// Close server after all tests
afterAll(() => {
  server.close()
})

// Mock environment variables
process.env.TEST_DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.FACEBOOK_APP_ID = 'test_app_id'
process.env.FACEBOOK_APP_SECRET = 'test_app_secret'
```

## Success Metrics

1. **Test Coverage**: >= 90% overall coverage
2. **Test Speed**: All unit tests complete trong < 10s
3. **Test Reliability**: 0% flaky tests
4. **Bug Detection**: Catch 100% của known edge cases
5. **Documentation**: Mỗi test case có clear description
6. **Maintainability**: Tests dễ update khi code changes

## Risk Mitigation

### Potential Risks

1. **Flaky Tests**: Network-dependent tests có thể flaky
   - Mitigation: Use MSW để mock tất cả network calls

2. **Slow Tests**: Integration tests có thể chậm
   - Mitigation: Use in-memory database, parallel execution

3. **Test Data Pollution**: Tests có thể affect nhau
   - Mitigation: Cleanup sau mỗi test, use transactions

4. **Mock Drift**: Mocks có thể outdated so với real API
   - Mitigation: Regular review và update mocks based on real API

5. **Coverage Gaps**: Một số edge cases có thể bị miss
   - Mitigation: Code review của test cases, coverage reports
