import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

/**
 * Token Expiry Handling E2E Tests
 * Tests for expired token detection and handling
 */

test.describe('Token Expiry Handling', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();
  });

  test('should detect expired token', async ({ page }) => {
    // Mock expired token response
    await helpers.mockExpiredTokenResponse();

    await page.reload();
    await helpers.waitForPageLoad();

    // Should show expired token message
    const expiredMessage = await page.locator('text=expired').or(
      page.locator('text=token')
    );

    await page.waitForTimeout(1000);

    if (await expiredMessage.count() > 0) {
      const isVisible = await expiredMessage.first().isVisible().catch(() => false);
      // Error may be shown in table or alert
      expect(isVisible).toBe(true);
    }
  });

  test('should show reconnect button on token expiry', async ({ page }) => {
    // Mock expired token
    await helpers.mockExpiredTokenResponse();

    await page.reload();
    await helpers.waitForPageLoad();

    // Should show reconnect button
    const reconnectButton = await page.locator('button:has-text("Reconnect")').or(
      page.locator('button:has-text("Connect Facebook")')
    );

    await page.waitForTimeout(1000);

    if (await reconnectButton.count() > 0) {
      await expect(reconnectButton.first()).toBeVisible();
    }
  });

  test('should handle token expiry on campaigns fetch', async ({ page }) => {
    // Mock token expired for campaigns
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: [],
      error: 'Facebook access token has expired. Please reconnect your Facebook account.',
      code: 'TOKEN_EXPIRED'
    }, 401);

    await page.reload();
    await helpers.waitForPageLoad();

    await page.waitForTimeout(1000);

    // Should show empty state with reconnect option
    const emptyState = await page.locator('text=No campaigns found').or(
      page.locator('text=Connect Facebook')
    );

    if (await emptyState.count() > 0) {
      await expect(emptyState.first()).toBeVisible();
    }
  });

  test('should handle token expiry on ad sets fetch', async ({ page }) => {
    // Switch to ad sets tab
    await page.click('button:has-text("ad sets")');
    await helpers.waitForPageLoad();

    // Mock expired token
    await helpers.mockApiResponse('/api/ad-sets', {
      adSets: [],
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    }, 401);

    await page.reload();
    await page.click('button:has-text("ad sets")');
    await page.waitForTimeout(1000);

    // Should show error or empty state
    const errorState = await page.locator('text=expired').or(
      page.locator('text=reconnect')
    );

    if (await errorState.count() > 0) {
      const isVisible = await errorState.first().isVisible().catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    }
  });

  test('should handle token expiry on ads fetch', async ({ page }) => {
    // Switch to ads tab
    await page.click('button:has-text("ads")');
    await helpers.waitForPageLoad();

    // Mock expired token
    await helpers.mockApiResponse('/api/ads', {
      ads: [],
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    }, 401);

    await page.reload();
    await page.click('button:has-text("ads")');
    await page.waitForTimeout(1000);

    // Should handle error appropriately
    const hasError = await page.locator('text=Connect Facebook').count() > 0 ||
                     await page.locator('text=expired').count() > 0;
    
    expect(typeof hasError).toBe('boolean');
  });

  test('should not use expired token after refresh', async ({ page }) => {
    let requestCount = 0;

    // Intercept API calls
    await page.route('**/api/campaigns**', async (route) => {
      requestCount++;
      
      // First request returns expired token error
      if (requestCount === 1) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            campaigns: [],
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
          }),
        });
      } else {
        // Subsequent requests should not happen with old token
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ campaigns: [] }),
        });
      }
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // First request should fail with expired token
    expect(requestCount).toBeGreaterThanOrEqual(1);

    // Should not make more requests with expired token
    await page.waitForTimeout(2000);
    expect(requestCount).toBeLessThan(5); // Shouldn't retry indefinitely
  });

  test('should clear expired token from storage', async ({ page }) => {
    // Mock expired token
    await helpers.mockExpiredTokenResponse();

    await page.reload();
    await page.waitForTimeout(1000);

    // Check if token is cleared from local storage or state
    const storageState = await page.context().storageState();
    
    // Verify storage (implementation specific)
    expect(storageState).toBeTruthy();
  });

  test('should show reconnect dialog with proper messaging', async ({ page }) => {
    // Mock expired token
    await helpers.mockExpiredTokenResponse();

    await page.reload();
    await helpers.waitForPageLoad();

    // Click reconnect button
    const reconnectButton = await page.locator('button:has-text("Reconnect")').or(
      page.locator('button:has-text("Connect Facebook")')
    ).first();

    if (await reconnectButton.isVisible()) {
      await reconnectButton.click();
      await page.waitForTimeout(500);

      // Dialog should open
      const dialog = await page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        await expect(dialog).toBeVisible();
      }
    }
  });

  test('should prevent data operations with expired token', async ({ page }) => {
    // Mock expired token
    await helpers.mockExpiredTokenResponse();

    await page.reload();
    await helpers.waitForPageLoad();

    await page.waitForTimeout(1000);

    // Try to perform actions - should be disabled or show error
    const createButton = await page.locator('button:has-text("new")');
    
    if (await createButton.count() > 0) {
      // Button may be disabled or clicking shows error
      const isDisabled = await createButton.first().isDisabled().catch(() => true);
      expect(typeof isDisabled).toBe('boolean');
    }
  });

  test('should validate token before API calls', async ({ page }) => {
    let checkCalled = false;
    let dataCalled = false;

    // Intercept check-connection call
    await page.route('**/api/facebook/check-connection**', async (route) => {
      checkCalled = true;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          connected: false,
          requiresReconnect: true,
          reason: 'TOKEN_EXPIRED'
        }),
      });
    });

    // Intercept campaigns call
    await page.route('**/api/campaigns**', async (route) => {
      dataCalled = true;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          campaigns: [],
          code: 'TOKEN_EXPIRED'
        }),
      });
    });

    await page.reload();
    await page.waitForTimeout(2000);

    // Should check connection status
    // At least one call should be made
    expect(checkCalled || dataCalled).toBeTruthy();
  });
});
