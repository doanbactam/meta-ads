# E2E Testing Suite

Comprehensive End-to-End testing suite using Playwright for the Ad Manager Dashboard.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This E2E test suite covers:

1. **Navigation & Layout** - Page navigation, routing, responsive design
2. **Ad Account Selector** - Account selection, validation, persistence
3. **Data Tables** - Campaigns, ad sets, ads table functionality
4. **Facebook Connection** - Connection flow, token validation
5. **Date Range Picker** - Date selection, presets, filtering
6. **Toast Notifications** - Sonner toast integration
7. **Token Expiry** - Expired token handling, reconnection
8. **Performance** - Load times, rendering efficiency
9. **Accessibility** - WCAG compliance, keyboard navigation

### Test Statistics

- **Total Test Files**: 9
- **Total Test Cases**: 80+
- **Coverage Areas**: Navigation, Forms, API Integration, UX, Performance, A11y

---

## 📦 Installation

### 1. Install Dependencies

```bash
npm install --save-dev @playwright/test
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Setup Environment Variables

Copy the example environment file:

```bash
cp .env.test.example .env.test.local
```

Edit `.env.test.local` with your test credentials:

```env
# Playwright
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000

# Test User Credentials (Clerk)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!

# Facebook Test Credentials
TEST_FACEBOOK_ACCESS_TOKEN=your_test_token_here
TEST_FACEBOOK_APP_ID=your_app_id_here
```

---

## 🚀 Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode (Recommended for Development)

```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### Run Specific Browser

```bash
# Chrome only
npm run test:e2e:chrome

# Firefox only
npm run test:e2e:firefox

# Safari only
npm run test:e2e:webkit
```

### Run Specific Test File

```bash
npx playwright test e2e/tests/01-navigation.spec.ts
```

### Run Tests Matching Pattern

```bash
npx playwright test --grep "should display"
```

### Debug Tests

```bash
npm run test:e2e:debug
```

### View Test Report

```bash
npm run test:e2e:report
```

---

## 📁 Test Structure

```
e2e/
├── fixtures/
│   └── test-data.ts          # Test data and selectors
├── helpers/
│   └── test-helpers.ts       # Reusable helper functions
├── setup/
│   └── auth.setup.ts         # Authentication setup
├── tests/
│   ├── 01-navigation.spec.ts
│   ├── 02-ad-account-selector.spec.ts
│   ├── 03-data-tables.spec.ts
│   ├── 04-facebook-connection.spec.ts
│   ├── 05-date-range-picker.spec.ts
│   ├── 06-toast-notifications.spec.ts
│   ├── 07-token-expiry.spec.ts
│   ├── 08-performance.spec.ts
│   └── 09-accessibility.spec.ts
├── .gitignore
└── README.md
```

---

## ✍️ Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

test.describe('Feature Name', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/your-page');
    await helpers.waitForPageLoad();
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await helpers.mockApiResponse('/api/endpoint', {
      data: []
    });

    // Act
    await page.click('button:has-text("Click Me")');

    // Assert
    const result = await page.locator('text=Result');
    await expect(result).toBeVisible();
  });
});
```

### Using Test Helpers

```typescript
// Wait for page load
await helpers.waitForPageLoad();

// Wait for toast notification
await helpers.waitForToast('success', 'Operation completed');

// Select ad account
await helpers.selectAdAccount('Test Account');

// Navigate to tab
await helpers.navigateToTab('campaigns');

// Wait for data table
await helpers.waitForDataTable();

// Search in table
await helpers.searchInTable('Test Campaign');

// Refresh data
await helpers.refreshData();

// Mock API response
await helpers.mockApiResponse('/api/campaigns', {
  campaigns: []
});

// Mock expired token
await helpers.mockExpiredTokenResponse();
```

### Using Test Data

```typescript
import { testCampaigns, testAdAccounts, selectors } from '../fixtures/test-data';

// Use test data
await helpers.mockApiResponse('/api/campaigns', {
  campaigns: [testCampaigns.activeCampaign]
});

// Use selectors
await page.click(selectors.refreshButton);
await page.fill(selectors.searchInput, 'query');
```

---

## 🎯 Best Practices

### 1. Use Data Test IDs

```tsx
// Component
<div data-testid="data-table">

// Test
await page.locator('[data-testid="data-table"]');
```

### 2. Wait for Elements Properly

```typescript
// ❌ Bad
await page.waitForTimeout(1000);

// ✅ Good
await page.waitForSelector('[data-testid="element"]');
await helpers.waitForPageLoad();
```

### 3. Use Meaningful Assertions

```typescript
// ❌ Bad
expect(await page.locator('div').count()).toBeGreaterThan(0);

// ✅ Good
const errorMessage = await page.locator('[role="alert"]');
await expect(errorMessage).toHaveText('Invalid input');
```

### 4. Mock External Dependencies

```typescript
// Mock API calls
await helpers.mockApiResponse('/api/campaigns', {
  campaigns: testData
});

// Mock Facebook API
await page.route('**/graph.facebook.com/**', route => {
  route.fulfill({ status: 200, body: '{}' });
});
```

### 5. Clean Up After Tests

```typescript
test.afterEach(async ({ page }) => {
  // Clear storage
  await page.context().clearCookies();
  
  // Reset state
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});
```

### 6. Use Page Object Pattern for Complex Pages

```typescript
class CampaignsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/campaigns');
  }

  async searchCampaign(name: string) {
    await this.page.fill('[placeholder="search"]', name);
  }

  async selectCampaign(name: string) {
    await this.page.click(`text=${name}`);
  }
}
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps
        
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_TEST_BASE_URL: http://localhost:3000
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🐛 Troubleshooting

### Tests Timing Out

```typescript
// Increase timeout for slow operations
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  
  await page.goto('/slow-page');
});
```

### Flaky Tests

```typescript
// Use proper waits
await page.waitForLoadState('networkidle');

// Retry failed tests
test.describe.configure({ retries: 2 });

// Use stable selectors
await page.locator('[data-testid="stable-id"]');
```

### Authentication Issues

```typescript
// Check auth setup
await page.goto('/sign-in');
await page.waitForSelector('[data-clerk-element="signIn"]');

// Verify signed-in state
const isSignedIn = await page.locator('[data-clerk-element="userButton"]').count() > 0;
```

### API Mocking Not Working

```typescript
// Mock before navigation
await page.route('**/api/**', route => {
  route.fulfill({ status: 200, body: '{}' });
});

await page.goto('/page');
```

### Debugging Tips

```bash
# Run with debugging
npx playwright test --debug

# Run headed to see browser
npx playwright test --headed

# Take screenshots
await page.screenshot({ path: 'screenshot.png' });

# Record video
# Video is automatically recorded in playwright.config.ts
```

---

## 📊 Test Reports

### HTML Report

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

### JSON Report

Test results are saved to `test-results.json`:

```json
{
  "stats": {
    "total": 80,
    "passed": 75,
    "failed": 3,
    "skipped": 2
  }
}
```

### Screenshots and Videos

- Screenshots: `test-results/` (on failure)
- Videos: `test-results/` (on failure)
- Traces: `test-results/` (on first retry)

---

## 🔐 Security Notes

1. **Never commit `.env.test.local`** - Contains sensitive credentials
2. **Use test accounts only** - Never use production credentials
3. **Mock external APIs** - Avoid real API calls in tests
4. **Clear sensitive data** - Clean up after tests

---

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)

---

## 🤝 Contributing

When adding new tests:

1. Follow existing test structure
2. Use helper functions for common operations
3. Add test data to `fixtures/test-data.ts`
4. Update this README if adding new test categories
5. Ensure tests pass before committing

---

## ✅ Test Checklist

Before merging:

- [ ] All tests pass locally
- [ ] Tests pass in CI/CD
- [ ] New features have test coverage
- [ ] Tests follow best practices
- [ ] Documentation is updated
- [ ] No hardcoded credentials
- [ ] Proper cleanup after tests

---

**Last Updated**: 2025-10-05  
**Maintainer**: Development Team  
**Test Framework**: Playwright v1.48.0
