# Implementation Plan - Facebook Logic Testing

- [x] 1. Setup test infrastructure và configuration





  - Cài đặt Vitest và các testing libraries cần thiết
  - Tạo vitest.config.ts với TypeScript support và coverage configuration
  - Setup test database configuration với separate DATABASE_URL
  - Tạo tests/setup.ts với MSW server initialization
  - _Requirements: All requirements - foundation cho tất cả tests_


- [x] 1.1 Install testing dependencies

  - Chạy `bun add -D vitest @vitest/ui @vitest/coverage-v8`
  - Chạy `bun add -D @testing-library/react @testing-library/react-hooks @testing-library/jest-dom`
  - Chạy `bun add -D msw@latest`
  - Verify installations thành công
  - _Requirements: All requirements_

- [x] 1.2 Create vitest configuration file


  - Tạo vitest.config.ts với globals, environment: 'node', setupFiles
  - Configure coverage provider: 'v8' với reporters: text, html, lcov
  - Setup path alias '@' pointing to './src'
  - Configure test timeout: 10000ms
  - _Requirements: All requirements_

- [x] 1.3 Create test setup file


  - Tạo tests/setup.ts
  - Import và setup MSW server với beforeAll/afterAll/afterEach
  - Mock environment variables: TEST_DATABASE_URL, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
  - Setup global test utilities
  - _Requirements: All requirements_

- [x] 1.4 Setup test database






  - Tạo separate test database trong PostgreSQL
  - Update .env.test với TEST_DATABASE_URL
  - Tạo tests/helpers/test-db.ts với setupTestDatabase() và cleanupTestDatabase()
  - Test database connection
  - _Requirements: 6, 10_


- [x] 2. Create test fixtures và mock data





  - Tạo comprehensive mock responses cho Facebook API
  - Tạo test data seeds cho database
  - Tạo reusable test helpers
  - _Requirements: All requirements - shared fixtures_

- [x] 2.1 Create Facebook API mock responses


  - Tạo tests/fixtures/facebook-responses.ts
  - Export mockValidTokenResponse với valid token data
  - Export mockExpiredTokenResponse với error code 190
  - Export mockCampaignsResponse với pagination
  - Export mockInsightsResponse với metrics
  - Export mockAdAccountsResponse, mockAdSetsResponse, mockAdsResponse
  - Export mockRateLimitResponse với error code 17/4/613
  - _Requirements: 1, 2, 3, 4, 5_

- [x] 2.2 Create test database seed data


  - Tạo tests/fixtures/test-data.ts
  - Export testUser với Clerk user data
  - Export testAdAccount với Facebook connection data
  - Export testCampaign, testAdSet, testAd với relationships
  - Export helper functions: createTestUser(), createTestAdAccount()
  - _Requirements: 6, 10_

- [x] 2.3 Create test helper utilities


  - Tạo tests/helpers/facebook-test-helpers.ts
  - Export mockFetch() helper để mock global fetch
  - Export mockRateLimiter() để mock rate limiters
  - Export mockCache() để mock cache instances
  - Export waitForAsync() để handle async operations
  - Export assertErrorThrown() để verify error throwing
  - _Requirements: All requirements_

- [x] 2.4 Setup MSW server với handlers


  - Tạo tests/helpers/mock-server.ts
  - Define handlers cho Facebook Graph API endpoints
  - Handler cho /debug_token endpoint
  - Handler cho /me/adaccounts endpoint
  - Handler cho /campaigns, /adsets, /ads endpoints
  - Handler cho /insights endpoints
  - Export setupServer() instance
  - _Requirements: 1, 2, 3, 4_

- [x] 3. Implement FacebookMarketingAPI unit tests




  - Test tất cả methods của FacebookMarketingAPI class
  - Cover token validation, fetching, pagination, rate limiting
  - Achieve >= 95% coverage
  - _Requirements: 1, 2, 3, 4, 5_

- [x] 3.1 Create test file và setup


  - Tạo tests/unit/facebook-api.test.ts
  - Import FacebookMarketingAPI và test utilities
  - Setup beforeEach để create fresh API instance
  - Setup afterEach để clear all mocks
  - _Requirements: 1, 2, 3, 4, 5_

- [x] 3.2 Write validateToken tests


  - Test: should return valid token info when token is valid
  - Test: should return invalid when token expired
  - Test: should retry on network timeout (max 2 retries)
  - Test: should extract business IDs from granular_scopes
  - Test: should handle malformed API response
  - Test: should return user-friendly error on network failure
  - _Requirements: 1_

- [x] 3.3 Write getBusinessAdAccounts tests


  - Test: should fetch both owned and client accounts in parallel
  - Test: should deduplicate accounts by ID
  - Test: should continue when client accounts endpoint fails
  - Test: should map account fields correctly (id, name, status, currency, timezone, businessId, accessType)
  - Test: should log warning when client accounts fail
  - _Requirements: 2_

- [x] 3.4 Write getUserAdAccounts tests


  - Test: should return cached data when cache hit
  - Test: should fetch from API when cache miss
  - Test: should cache result with 30 min TTL
  - Test: should apply rate limiting before fetch
  - Test: should handle empty response
  - _Requirements: 2_

- [x] 3.5 Write getCampaigns tests


  - Test: should fetch all pages with pagination
  - Test: should use cache when available (3 min TTL)
  - Test: should format account ID with 'act_' prefix
  - Test: should map campaign fields correctly
  - Test: should throw FacebookTokenExpiredError on 401
  - Test: should handle network errors
  - _Requirements: 3, 5_

- [x] 3.6 Write getCampaignInsights tests


  - Test: should format date range correctly with time_range parameter
  - Test: should use date_preset when provided
  - Test: should default to 'last_30d' when no date options
  - Test: should return null when no data available
  - Test: should cache results with 10 min TTL
  - Test: should parse metrics correctly (impressions, clicks, spend, etc.)
  - Test: should cache null result with 2 min TTL
  - _Requirements: 4_

- [x] 3.7 Write fetchAllPages tests


  - Test: should fetch all pages until no next URL
  - Test: should respect max pages limit (100)
  - Test: should detect pagination loops với visited Set
  - Test: should abort on loop detection
  - Test: should apply rate limiting before each request
  - Test: should check x-app-usage header và throttle when >= 95
  - Test: should retry on rate limit errors với exponential backoff
  - Test: should retry on temporary issues (code 2)
  - Test: should throw FacebookTokenExpiredError on code 190
  - Test: should reset retry count on successful response
  - Test: should log pagination progress
  - _Requirements: 3, 5_

- [x] 3.8 Write getAdSets và getAds tests






  - Test getAdSets: should fetch all ad sets với pagination
  - Test getAdSets: should use cache with 3 min TTL
  - Test getAds: should fetch all ads với pagination
  - Test getAds: should use cache with 3 min TTL
  - Test both: should handle token expiry
  - _Requirements: 3_

- [x] 3.9 Write insights tests for ad sets và ads






  - Test getAdSetInsights: should fetch và parse insights
  - Test getAdInsights: should fetch và parse insights
  - Test both: should handle no data gracefully
  - Test both: should handle token expiry
  - _Requirements: 4_


- [x] 4. Implement FacebookSyncService unit tests




  - Test sync orchestration và database operations
  - Cover campaigns, ad sets, ads syncing
  - Test error handling và recovery
  - _Requirements: 6, 9, 10_

- [x] 4.1 Create test file và setup


  - Tạo tests/unit/facebook-sync-service.test.ts
  - Import FacebookSyncService và dependencies
  - Mock FacebookMarketingAPI methods
  - Mock Prisma client
  - Setup beforeEach để create fresh service instance
  - _Requirements: 6_

- [x] 4.2 Write syncAll orchestration tests

  - Test: should skip sync when recently synced (< 10 min)
  - Test: should force sync when force=true
  - Test: should update syncStatus to SYNCING before sync
  - Test: should call syncCampaigns, syncAdSets, syncAds in order
  - Test: should update syncStatus to IDLE on success
  - Test: should update syncStatus to ERROR on failure
  - Test: should collect errors from all sync operations
  - Test: should update lastSyncedAt timestamp
  - _Requirements: 6_

- [x] 4.3 Write syncCampaigns tests


  - Test: should fetch campaigns from API
  - Test: should fetch insights for each campaign
  - Test: should upsert campaigns to database
  - Test: should convert budget from cents to dollars (divide by 100)
  - Test: should map Facebook status to Prisma CampaignStatus enum
  - Test: should handle missing insights gracefully
  - Test: should continue on individual campaign error
  - Test: should update lastSyncedAt for each campaign
  - Test: should return synced count và errors array
  - _Requirements: 6, 10_

- [x] 4.4 Write syncAdSets tests


  - Test: should fetch campaigns from database
  - Test: should fetch ad sets for each campaign
  - Test: should skip campaigns without facebookCampaignId
  - Test: should fetch insights for each ad set
  - Test: should upsert ad sets với campaignId relationship
  - Test: should convert budget và spend from cents to dollars
  - Test: should map status to AdSetStatus enum
  - Test: should handle missing insights
  - Test: should continue on errors
  - _Requirements: 6, 10_

- [x] 4.5 Write syncAds tests


  - Test: should fetch ad sets from database
  - Test: should fetch ads for each ad set
  - Test: should skip ad sets without facebookAdSetId
  - Test: should fetch insights for each ad
  - Test: should upsert ads (creatives) với adGroupId relationship
  - Test: should convert spend from cents to dollars
  - Test: should map status to CreativeStatus enum
  - Test: should handle missing insights và creative data
  - Test: should continue on errors
  - _Requirements: 6, 10_

- [x] 4.6 Write syncAllAdAccounts tests






  - Test: should find ad accounts needing sync (lastSyncedAt > 10 min ago)
  - Test: should skip accounts synced recently
  - Test: should sync multiple accounts in sequence
  - Test: should collect errors from all accounts
  - Test: should handle accounts without token or ad account ID
  - _Requirements: 6_

- [ ] 5. Implement useFacebookConnection hook tests
  - Test React hook behavior với TanStack Query
  - Test connection status management
  - Test connect flow và query invalidation
  - _Requirements: 7_

- [ ] 5.1 Create test file và setup
  - Tạo tests/unit/facebook-connection-hook.test.ts
  - Import useFacebookConnection và testing utilities
  - Setup QueryClient wrapper cho renderHook
  - Mock fetch global function
  - Mock useFacebookStore
  - _Requirements: 7_

- [ ] 5.2 Write connection status tests
  - Test: should fetch connection status on mount when adAccountId provided
  - Test: should return connected=false when no adAccountId
  - Test: should return connected=true với full info when connected
  - Test: should return connected=false với requiresReconnect when token expired
  - Test: should use cached data within stale time (2 min)
  - Test: should refetch after stale time expires
  - Test: should retry once on failure
  - _Requirements: 7_

- [ ] 5.3 Write connectFacebook tests
  - Test: should call /api/facebook/connect với accessToken và fbAdAccountId
  - Test: should update store state on success
  - Test: should invalidate all related queries on success
  - Test: should close dialog on success
  - Test: should return success=true với data on success
  - Test: should return success=false với error on failure
  - Test: should set connected=false on error
  - _Requirements: 7_

- [ ]* 5.4 Write checkConnection tests
  - Test: should parse connection status from API response
  - Test: should handle API errors gracefully
  - Test: should return requiresReconnect on token expiry
  - Test: should parse tokenExpiry date correctly
  - Test: should extract scopes from response
  - _Requirements: 7_

- [ ] 6. Implement integration tests
  - Test real interactions giữa components
  - Use MSW để mock Facebook API
  - Use test database cho Prisma operations
  - _Requirements: All requirements_

- [ ] 6.1 Create Facebook API integration test
  - Tạo tests/integration/facebook-api-integration.test.ts
  - Setup MSW server với realistic delays
  - Test: should validate token với real-like flow
  - Test: should handle Facebook API error responses
  - Test: should respect rate limiting với concurrent requests
  - Test: should handle pagination với multiple pages
  - Test: should cache và retrieve from cache correctly
  - _Requirements: 1, 2, 3, 4, 5_

- [ ] 6.2 Create sync service integration test
  - Tạo tests/integration/facebook-sync-integration.test.ts
  - Setup test database với beforeEach/afterEach
  - Test: should sync campaigns to database
  - Test: should create relationships between campaigns và ad sets
  - Test: should update existing campaigns on re-sync
  - Test: should handle partial sync failures
  - Test: should maintain data integrity on errors
  - _Requirements: 6, 9, 10_

- [ ]* 6.3 Create connection API integration test
  - Tạo tests/integration/facebook-connection-api.test.ts
  - Test /api/facebook/check-connection endpoint
  - Test /api/facebook/connect endpoint
  - Test token validation flow
  - Test error responses
  - _Requirements: 7_


- [ ] 7. Enhance E2E tests
  - Mở rộng existing Playwright tests
  - Add more scenarios cho token expiry và sync
  - Test error handling flows
  - _Requirements: 8, 9_

- [ ] 7.1 Add token expiry E2E tests
  - Mở e2e/tests/04-facebook-connection.spec.ts
  - Test: should handle token expiry during campaign fetch
  - Test: should show reconnect prompt when token expires mid-session
  - Test: should successfully reconnect và resume operations
  - Mock token expiry response từ API
  - _Requirements: 8, 9_

- [ ] 7.2 Add sync progress E2E tests
  - Test: should display sync progress indicator during sync
  - Test: should show success message after sync completes
  - Test: should sync all authorized accounts automatically
  - Test: should update campaign list after sync
  - _Requirements: 8_

- [ ]* 7.3 Add error handling E2E tests
  - Test: should display error message on network failure
  - Test: should retry failed syncs automatically
  - Test: should allow manual retry on persistent errors
  - Test: should handle rate limiting gracefully
  - _Requirements: 8, 9_

- [ ] 8. Measure và improve test coverage
  - Run coverage reports
  - Identify uncovered code paths
  - Add tests cho uncovered areas
  - _Requirements: All requirements_

- [ ] 8.1 Generate coverage report
  - Chạy `bun run test:coverage`
  - Review coverage report trong terminal
  - Generate HTML report: `bun run test:coverage:html`
  - Open coverage/index.html để review chi tiết
  - _Requirements: All requirements_

- [ ] 8.2 Analyze coverage gaps
  - Identify files với coverage < 90%
  - List uncovered lines và branches
  - Prioritize critical paths cần cover
  - Document coverage gaps trong issue tracker
  - _Requirements: All requirements_

- [ ] 8.3 Add tests for uncovered paths
  - Write additional tests cho uncovered lines
  - Focus on error paths và edge cases
  - Test boundary conditions
  - Verify coverage improvement sau mỗi test
  - _Requirements: All requirements_

- [ ] 8.4 Optimize test performance
  - Identify slow tests (> 1s)
  - Optimize database operations với transactions
  - Use parallel test execution
  - Reduce unnecessary setup/teardown
  - Target: all unit tests < 10s total
  - _Requirements: All requirements_

- [ ] 9. Add test scripts to package.json
  - Add convenient npm scripts cho testing
  - Configure test environments
  - Setup CI/CD integration
  - _Requirements: All requirements_

- [ ] 9.1 Add test scripts
  - Add `test` script: `vitest`
  - Add `test:unit` script: `vitest tests/unit`
  - Add `test:integration` script: `vitest tests/integration`
  - Add `test:coverage` script: `vitest --coverage`
  - Add `test:ui` script: `vitest --ui`
  - Add `test:watch` script: `vitest --watch`
  - _Requirements: All requirements_

- [ ]* 9.2 Configure test environments
  - Create .env.test file với test environment variables
  - Document required environment variables
  - Add .env.test.example template
  - Update README với testing instructions
  - _Requirements: All requirements_

- [ ]* 9.3 Setup CI/CD integration
  - Add GitHub Actions workflow cho tests
  - Run tests on pull requests
  - Generate coverage reports
  - Fail build if coverage < 90%
  - _Requirements: All requirements_

- [ ] 10. Documentation và cleanup
  - Document test patterns
  - Create testing guide
  - Clean up test code
  - _Requirements: All requirements_

- [ ] 10.1 Create testing guide
  - Tạo docs/TESTING.md
  - Document test structure và organization
  - Explain mocking strategies
  - Provide examples cho common test patterns
  - Document how to run tests
  - _Requirements: All requirements_

- [ ]* 10.2 Document test fixtures
  - Add JSDoc comments cho test fixtures
  - Explain mock data structure
  - Document how to create new fixtures
  - Add examples of fixture usage
  - _Requirements: All requirements_

- [ ]* 10.3 Code review và refactoring
  - Review all test code cho consistency
  - Refactor duplicate test logic
  - Extract common test utilities
  - Ensure test naming conventions
  - _Requirements: All requirements_

- [ ]* 10.4 Final verification
  - Run full test suite
  - Verify all tests pass
  - Check coverage meets targets (>= 90%)
  - Test on clean environment
  - Document any known issues
  - _Requirements: All requirements_
