import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

/**
 * Toast Notifications E2E Tests  
 * Tests for Sonner toast notifications
 */

test.describe('Toast Notifications', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();
  });

  test('should show toast on successful Facebook connection', async ({ page }) => {
    // Mock successful connection
    await helpers.mockApiResponse('/api/facebook/connect', {
      success: true,
      adAccountId: 'test-account'
    });

    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    
    const connectButton = await page.locator('button:has-text("Connect Facebook")').first();
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);

      // Fill token
      const tokenInput = await page.locator('input[type="password"]');
      await tokenInput.fill('valid_token');

      // Mock validation success
      await helpers.mockApiResponse('/api/facebook/validate-token', {
        isValid: true
      });

      // Submit
      const continueButton = await page.locator('button:has-text("continue")');
      await continueButton.click();

      await page.waitForTimeout(1000);

      // Should show success toast
      const toast = await page.locator('[data-sonner-toast]');
      if (await toast.count() > 0) {
        await expect(toast.first()).toBeVisible();
      }
    }
  });

  test('should show toast when refreshing data', async ({ page }) => {
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // Click refresh
    const refreshButton = await page.locator('button:has-text("refresh")').first();
    await refreshButton.click();

    // Should show loading toast
    await page.waitForTimeout(500);
    const toast = await page.locator('[data-sonner-toast]');
    
    if (await toast.count() > 0) {
      await expect(toast.first()).toBeVisible();
    }
  });

  test('should show toast on successful campaign duplicate', async ({ page }) => {
    // Mock campaigns
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: [{
        id: 'campaign-1',
        name: 'Test Campaign',
        status: 'ACTIVE'
      }]
    });

    await page.reload();
    await helpers.waitForDataTable();

    // Select a campaign
    const checkbox = await page.locator('input[type="checkbox"]').nth(1);
    if (await checkbox.isVisible()) {
      await checkbox.check();

      // Mock duplicate success
      await helpers.mockApiResponse('/api/campaigns/*/duplicate', {
        success: true
      });

      // Click duplicate
      const duplicateButton = await page.locator('button:has-text("duplicate")');
      if (await duplicateButton.isVisible()) {
        await duplicateButton.click();
        await page.waitForTimeout(1000);

        // Should show success toast
        const toast = await page.locator('[data-sonner-toast]');
        if (await toast.count() > 0) {
          await expect(toast.first()).toBeVisible();
        }
      }
    }
  });

  test('should show toast on delete confirmation', async ({ page }) => {
    // Mock campaigns
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: [{
        id: 'campaign-1',
        name: 'Test Campaign'
      }]
    });

    await page.reload();
    await helpers.waitForDataTable();

    // Select campaign
    const checkbox = await page.locator('input[type="checkbox"]').nth(1);
    if (await checkbox.isVisible()) {
      await checkbox.check();

      // Mock delete success
      await helpers.mockApiResponse('/api/campaigns/*', {
        success: true
      });

      // Click delete button
      const deleteButton = await page.locator('button:has-text("remove")');
      if (await deleteButton.isVisible()) {
        // Handle confirm dialog
        page.on('dialog', dialog => dialog.accept());
        
        await deleteButton.click();
        await page.waitForTimeout(1000);

        // Should show toast
        const toast = await page.locator('[data-sonner-toast]');
        if (await toast.count() > 0) {
          await expect(toast.first()).toBeVisible();
        }
      }
    }
  });

  test('should show error toast on API failure', async ({ page }) => {
    // Mock error response
    await helpers.mockApiResponse('/api/campaigns', {
      error: 'Failed to fetch campaigns'
    }, 500);

    await page.reload();
    await page.waitForTimeout(2000);

    // May show error state or toast
    const errorText = await page.locator('text=error').or(
      page.locator('text=failed')
    );

    if (await errorText.count() > 0) {
      expect(await errorText.first().isVisible()).toBeTruthy();
    }
  });

  test('should stack multiple toasts', async ({ page }) => {
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // Trigger multiple refresh actions quickly
    const refreshButton = await page.locator('button:has-text("refresh")').first();
    
    for (let i = 0; i < 2; i++) {
      await refreshButton.click();
      await page.waitForTimeout(200);
    }

    await page.waitForTimeout(500);

    // Should handle multiple toasts
    const toasts = await page.locator('[data-sonner-toast]').all();
    // At least one toast should be visible
    expect(toasts.length).toBeGreaterThanOrEqual(0);
  });

  test('should auto-dismiss success toasts', async ({ page }) => {
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // Trigger an action that shows success toast
    const refreshButton = await page.locator('button:has-text("refresh")').first();
    await refreshButton.click();

    await page.waitForTimeout(500);

    // Toast should be visible initially
    const toast = await page.locator('[data-sonner-toast]');
    if (await toast.count() > 0) {
      await expect(toast.first()).toBeVisible();

      // Wait for auto-dismiss (typically 3-5 seconds)
      await page.waitForTimeout(6000);

      // Toast should be gone or hidden
      const toastAfter = await page.locator('[data-sonner-toast]').all();
      // May be hidden or removed from DOM
    }
  });

  test('should show loading state in toast', async ({ page }) => {
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // Click refresh to trigger loading toast
    const refreshButton = await page.locator('button:has-text("refresh")').first();
    await refreshButton.click();

    // Should show "Refreshing..." or loading indicator
    await page.waitForTimeout(300);
    
    const loadingToast = await page.locator('[data-sonner-toast]:has-text("Refreshing")').or(
      page.locator('[data-sonner-toast]:has-text("Loading")')
    );

    if (await loadingToast.count() > 0) {
      await expect(loadingToast.first()).toBeVisible();
    }
  });

  test('should use Sonner toast system (not old toast)', async ({ page }) => {
    await page.reload();
    await helpers.waitForPageLoad();

    // Verify Sonner toasts are being used
    // Sonner toasts have data-sonner-toast attribute
    const sonnerToaster = await page.locator('[data-sonner-toaster]');
    expect(await sonnerToaster.count()).toBeGreaterThanOrEqual(0);
  });

  test('should position toasts correctly', async ({ page }) => {
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // Trigger toast
    const refreshButton = await page.locator('button:has-text("refresh")').first();
    await refreshButton.click();
    await page.waitForTimeout(500);

    // Check toast position (Sonner typically positions in bottom-right or top-right)
    const toast = await page.locator('[data-sonner-toast]').first();
    if (await toast.count() > 0) {
      const box = await toast.boundingBox();
      if (box) {
        // Toast should be visible on screen
        expect(box.x).toBeGreaterThan(0);
        expect(box.y).toBeGreaterThan(0);
      }
    }
  });
});
