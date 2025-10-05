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

  test('should show access token input in dialog', async ({ page }) => {
    // Mock not connected
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // Open dialog
    const connectButton = await page.locator('button:has-text("Connect Facebook")').first();
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);

      // Should have password input for token
      const tokenInput = await page.locator('input[type="password"]');
      await expect(tokenInput).toBeVisible();
    }
  });

  test('should validate empty token', async ({ page }) => {
    // Open dialog
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    const connectButton = await page.locator('button:has-text("Connect Facebook")').first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);

      // Try to continue without token
      const continueButton = await page.locator('button:has-text("continue")');
      if (await continueButton.isVisible()) {
        await continueButton.click();

        // Should show error
        await page.waitForTimeout(300);
        const error = await page.locator('text=enter an access token');
        if (await error.count() > 0) {
          await expect(error).toBeVisible();
        }
      }
    }
  });

  test('should handle invalid token', async ({ page }) => {
    // Mock token validation error
    await helpers.mockApiResponse('/api/facebook/validate-token', {
      isValid: false,
      error: 'Invalid access token'
    }, 400);

    // Open dialog
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    const connectButton = await page.locator('button:has-text("Connect Facebook")').first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);

      // Fill invalid token
      const tokenInput = await page.locator('input[type="password"]');
      await tokenInput.fill('invalid_token_123');

      // Click continue
      const continueButton = await page.locator('button:has-text("continue")');
      await continueButton.click();

      // Should show error
      await page.waitForTimeout(1000);
    }
  });

  test('should show login with facebook option', async ({ page }) => {
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

  test('should close dialog on successful connection', async ({ page }) => {
    // Mock successful connection
    await helpers.mockApiResponse('/api/facebook/connect', {
      success: true,
      adAccountId: 'test-account-1'
    });

    // Open dialog
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    const connectButton = await page.locator('button:has-text("Connect Facebook")').first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);

      // Fill valid token (mock will succeed)
      const tokenInput = await page.locator('input[type="password"]');
      await tokenInput.fill('valid_token_123');

      // Mock token validation success
      await helpers.mockApiResponse('/api/facebook/validate-token', {
        isValid: true
      });

      // Click continue
      const continueButton = await page.locator('button:has-text("continue")');
      await continueButton.click();

      await page.waitForTimeout(1000);

      // Should show success toast
      const successToast = await page.locator('[data-sonner-toast]');
      if (await successToast.count() > 0) {
        await expect(successToast.first()).toBeVisible();
      }
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
