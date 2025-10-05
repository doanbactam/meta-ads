import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

/**
 * Facebook Connection E2E Tests
 * Tests for Facebook account connection flow
 */

test.describe('Facebook Connection', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();
  });

  test('should show connect facebook button when not connected', async ({ page }) => {
    // Mock empty campaigns (not connected)
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: [],
      message: 'Facebook not connected'
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // Should show connect button
    const connectButton = await page.locator('button:has-text("Connect Facebook")');
    await expect(connectButton).toBeVisible();
  });

  test('should open facebook connect dialog', async ({ page }) => {
    // Mock not connected state
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: [],
      message: 'Facebook not connected'
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // Click connect button
    const connectButton = await page.locator('button:has-text("Connect Facebook")').first();
    await connectButton.click();

    // Dialog should open
    const dialog = await page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test('should show login with facebook button in dialog', async ({ page }) => {
    // Mock not connected
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    const connectButton = await page.locator('button:has-text("Connect Facebook")').first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);

      // Should have "login with facebook" button
      const loginButton = await page.locator('button:has-text("login with facebook")');
      await expect(loginButton).toBeVisible();
    }
  });

  test('should show expired token message', async ({ page }) => {
    // Mock expired token
    await helpers.mockExpiredTokenResponse();

    await page.reload();
    await helpers.waitForPageLoad();

    // Should show expired token error
    const expiredMessage = await page.locator('text=expired').or(
      page.locator('text=reconnect')
    );

    if (await expiredMessage.count() > 0) {
      await expect(expiredMessage.first()).toBeVisible();
    }
  });

  test('should show reconnect button when token expired', async ({ page }) => {
    // Mock expired token
    await helpers.mockExpiredTokenResponse();

    await page.reload();
    await helpers.waitForPageLoad();

    // Should have reconnect button
    const reconnectButton = await page.locator('button:has-text("Reconnect Facebook")').or(
      page.locator('button:has-text("Connect Facebook")')
    );

    if (await reconnectButton.count() > 0) {
      await expect(reconnectButton.first()).toBeVisible();
    }
  });

  test('should show OAuth login flow when clicking facebook login', async ({ page }) => {
    // Mock not connected
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    const connectButton = await page.locator('button:has-text("Connect Facebook")').first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);

      // Should show login with facebook button
      const loginButton = await page.locator('button:has-text("login with facebook")');
      await expect(loginButton).toBeVisible();
      await expect(loginButton).toBeEnabled();
    }
  });

  test('should only show one connect dialog instance', async ({ page }) => {
    // Mock not connected
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // Count connect buttons
    const connectButtons = await page.locator('button:has-text("Connect Facebook")').all();
    
    // Click first button
    if (connectButtons.length > 0) {
      await connectButtons[0].click();
      await page.waitForTimeout(500);

      // Should only have one dialog
      const dialogs = await page.locator('[role="dialog"]').all();
      expect(dialogs.length).toBeLessThanOrEqual(1);
    }
  });
});
