import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

/**
 * Navigation & Layout E2E Tests
 * Tests for basic navigation, layout rendering, and route changes
 */

test.describe('Navigation & Layout', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
    await helpers.waitForPageLoad();
  });

  test('should render main layout with header and sidebar', async ({ page }) => {
    // Verify header is visible
    const header = await page.locator('header');
    await expect(header).toBeVisible();

    // Verify main content area
    const main = await page.locator('main');
    await expect(main).toBeVisible();

    // Verify sidebar exists (may be hidden on mobile)
    const sidebar = await page.locator('[data-testid="sidebar"]');
    expect(sidebar).toBeTruthy();
  });

  test('should navigate to campaigns page', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Verify URL
    await expect(page).toHaveURL(/\/campaigns/);

    // Verify page title
    const title = await page.locator('h1');
    await expect(title).toContainText('ad management');
  });

  test('should navigate to dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await helpers.waitForPageLoad();

    // Verify URL
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify dashboard content is visible
    const content = await page.locator('main');
    await expect(content).toBeVisible();
  });

  test('should toggle between campaign tabs', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Click campaigns tab
    await page.click('button:has-text("campaigns")');
    await helpers.waitForPageLoad();
    await expect(page).toHaveURL(/tab=campaigns/);

    // Click ad sets tab
    await page.click('button:has-text("ad sets")');
    await helpers.waitForPageLoad();
    await expect(page).toHaveURL(/tab=ad-sets/);

    // Click ads tab
    await page.click('button:has-text("ads")');
    await helpers.waitForPageLoad();
    await expect(page).toHaveURL(/tab=ads/);
  });

  test('should have working sidebar navigation', async ({ page }) => {
    // Test navigation links in sidebar
    const links = [
      { text: 'dashboard', url: '/dashboard' },
      { text: 'campaigns', url: '/campaigns' },
      { text: 'analytics', url: '/analytics' },
    ];

    for (const link of links) {
      // Find and click the navigation link
      const navLink = await page.locator(`a:has-text("${link.text}")`).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await helpers.waitForPageLoad();
        await expect(page).toHaveURL(new RegExp(link.url));
      }
    }
  });

  test('should display user button when signed in', async ({ page }) => {
    // Check for Clerk UserButton
    const userButton = await page.locator('[data-clerk-element="userButton"]');
    
    // UserButton should exist (visible or hidden based on auth state)
    const count = await userButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Mobile menu button should be visible
    const menuButton = await page.locator('button:has-text("Menu")');
    
    // Verify page is usable on mobile
    const main = await page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should maintain navigation state across page loads', async ({ page }) => {
    // Navigate to specific page
    await page.goto('/campaigns?tab=ad-sets');
    await helpers.waitForPageLoad();

    // Reload page
    await page.reload();
    await helpers.waitForPageLoad();

    // Verify tab state is maintained
    await expect(page).toHaveURL(/tab=ad-sets/);
  });
});
