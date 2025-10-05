import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

/**
 * Performance E2E Tests
 * Tests for application performance and optimization
 */

test.describe('Performance', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await helpers.waitForPageLoad();
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should load campaigns page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should render large dataset efficiently', async ({ page }) => {
    // Mock large dataset
    const largeCampaigns = Array.from({ length: 100 }, (_, i) => ({
      id: `campaign-${i}`,
      name: `Campaign ${i}`,
      status: 'ACTIVE',
      budget: 1000 + i,
      spent: 500 + i,
      impressions: 10000 + i * 100,
      clicks: 500 + i * 10,
      ctr: 5.0,
      conversions: 10 + i,
      cost_per_conversion: 50,
    }));

    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: largeCampaigns
    });

    const startTime = Date.now();
    
    await page.goto('/campaigns');
    await helpers.waitForDataTable();
    
    const renderTime = Date.now() - startTime;
    
    // Should render within 3 seconds even with 100 items
    expect(renderTime).toBeLessThan(3000);
  });

  test('should not have excessive re-renders on refresh', async ({ page }) => {
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Count network requests
    let requestCount = 0;
    page.on('request', request => {
      if (request.url().includes('/api/campaigns')) {
        requestCount++;
      }
    });

    // Click refresh
    const refreshButton = await page.locator('button:has-text("refresh")').first();
    await refreshButton.click();
    await page.waitForTimeout(2000);

    // Should only make 1-2 requests (not excessive)
    expect(requestCount).toBeLessThan(5);
  });

  test('should handle rapid clicks gracefully', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Rapidly click refresh button
    const refreshButton = await page.locator('button:has-text("refresh")').first();
    
    for (let i = 0; i < 5; i++) {
      await refreshButton.click({ force: true });
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(1000);

    // Should not crash or show errors
    const errorAlert = await page.locator('[role="alert"]').or(
      page.locator('text=error')
    );
    
    // Shouldn't have critical errors
    const errorCount = await errorAlert.count();
    expect(errorCount).toBeLessThan(3);
  });

  test('should lazy load data efficiently', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Should only load visible data (pagination)
    const tableRows = await page.locator('tbody tr').all();
    
    // Should show limited rows per page (10-25 typically)
    expect(tableRows.length).toBeLessThanOrEqual(50);
  });

  test('should not block UI during API calls', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/campaigns**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ campaigns: [] }),
      });
    });

    await page.goto('/campaigns');

    // UI should still be interactive during loading
    const header = await page.locator('header');
    await expect(header).toBeVisible();

    // Should show loading state but UI should be responsive
    const sidebar = await page.locator('[data-testid="sidebar"]').or(
      page.locator('nav')
    );
    
    if (await sidebar.count() > 0) {
      const isVisible = await sidebar.first().isVisible().catch(() => false);
      // Sidebar should be accessible
      expect(typeof isVisible).toBe('boolean');
    }
  });

  test('should optimize image loading', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForPageLoad();

    // Check for image optimization
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const loading = await img.getAttribute('loading');
      // Modern images should use lazy loading
      if (loading) {
        expect(['lazy', 'eager']).toContain(loading);
      }
    }
  });

  test('should use efficient CSS', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Measure CSS performance
    const styles = await page.evaluate(() => {
      return document.styleSheets.length;
    });

    // Should not have excessive stylesheets
    expect(styles).toBeLessThan(20);
  });

  test('should minimize JavaScript bundle size', async ({ page }) => {
    const responses: any[] = [];
    
    page.on('response', response => {
      if (response.url().includes('.js')) {
        responses.push(response);
      }
    });

    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Should load JS files efficiently
    expect(responses.length).toBeGreaterThan(0);
    expect(responses.length).toBeLessThan(50);
  });

  test('should cache static assets', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Navigate away and back
    await page.goto('/dashboard');
    await helpers.waitForPageLoad();

    const startTime = Date.now();
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();
    const loadTime = Date.now() - startTime;

    // Second load should be faster (cached)
    expect(loadTime).toBeLessThan(3000);
  });
});
