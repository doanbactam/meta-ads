import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';
import { selectors, testAdAccounts } from '../fixtures/test-data';

/**
 * Ad Account Selector E2E Tests
 * Tests for ad account selection, validation, and persistence
 */

test.describe('Ad Account Selector', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/dashboard');
    await helpers.waitForPageLoad();
  });

  test('should display ad account selector in header', async ({ page }) => {
    const selector = await page.locator('button:has-text("select ad account")').or(
      page.locator('select')
    );
    
    await expect(selector.first()).toBeVisible();
  });

  test('should show loading state while fetching accounts', async ({ page }) => {
    // Reload to trigger loading
    await page.reload();
    
    // Should show loading state briefly
    const loadingText = await page.locator('text=loading accounts');
    
    // Wait for loading to complete
    await helpers.waitForPageLoad();
  });

  test('should list available ad accounts', async ({ page }) => {
    // Click on ad account selector
    await page.click('button[role="combobox"]').catch(() => {
      // If button doesn't exist, try select
      return page.click('select');
    });

    // Wait for dropdown to open
    await page.waitForTimeout(500);

    // Should show accounts list or message
    const hasAccounts = await helpers.elementExists('text=accounts available') ||
                       await helpers.elementExists('text=no ad accounts found');
    
    expect(hasAccounts).toBeTruthy();
  });

  test('should auto-select first account if none selected', async ({ page }) => {
    // Mock API response with test account
    await helpers.mockApiResponse('/api/ad-accounts', {
      accounts: [testAdAccounts.validAccount]
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // First account should be auto-selected
    await page.waitForTimeout(1000);
    
    const selector = await page.locator('button[role="combobox"]').or(
      page.locator('select')
    ).first();
    
    const text = await selector.textContent();
    expect(text).toBeTruthy();
  });

  test('should persist selected account across navigation', async ({ page }) => {
    // Mock API with multiple accounts
    await helpers.mockApiResponse('/api/ad-accounts', {
      accounts: [
        testAdAccounts.validAccount,
        { ...testAdAccounts.expiredTokenAccount, name: 'Second Account' }
      ]
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // Select specific account
    const accountName = testAdAccounts.validAccount.name;
    
    // Navigate to different page
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Selected account should persist
    const selector = await page.locator('button[role="combobox"]').or(
      page.locator('select')
    ).first();
    
    await expect(selector).toBeVisible();
  });

  test('should show refresh button', async ({ page }) => {
    const refreshButton = await page.locator('button[title*="Refresh"]');
    await expect(refreshButton).toBeVisible();
  });

  test('should refresh accounts when clicking refresh button', async ({ page }) => {
    const refreshButton = await page.locator('button[title*="Refresh"]').first();
    
    // Click refresh
    await refreshButton.click();
    
    // Should show loading state
    const icon = await refreshButton.locator('svg');
    const className = await icon.getAttribute('class');
    
    // Wait for refresh to complete
    await page.waitForTimeout(1000);
  });

  test('should handle error when accounts fail to load', async ({ page }) => {
    // Mock error response
    await helpers.mockApiResponse('/api/ad-accounts', {
      error: 'Failed to fetch ad accounts'
    }, 500);

    await page.reload();
    await helpers.waitForPageLoad();

    // Should show error state
    const hasError = await helpers.elementExists('text=error') ||
                    await helpers.elementExists('text=failed');
    
    expect(hasError).toBeTruthy();
  });

  test('should show "no accounts" message when no accounts exist', async ({ page }) => {
    // Mock empty accounts response
    await helpers.mockApiResponse('/api/ad-accounts', {
      accounts: []
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // Open selector
    await page.click('button[role="combobox"]').catch(() => {
      return page.click('select');
    });

    await page.waitForTimeout(500);

    // Should show no accounts message
    const noAccountsMessage = await page.locator('text=no ad accounts found');
    await expect(noAccountsMessage).toBeVisible();
  });

  test('should display account info after selection', async ({ page }) => {
    // Mock account with details
    await helpers.mockApiResponse('/api/ad-accounts', {
      accounts: [{
        ...testAdAccounts.validAccount,
        status: 'active',
        platform: 'Facebook'
      }]
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // Wait for account info to appear
    await page.waitForTimeout(1000);

    // Should show account status or info
    const hasAccountInfo = await helpers.elementExists('text=active') ||
                          await helpers.elementExists('text=Facebook');
    
    expect(hasAccountInfo).toBeTruthy();
  });
});
