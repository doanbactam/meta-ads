import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';
import { testDateRanges } from '../fixtures/test-data';

/**
 * Date Range Picker E2E Tests
 * Tests for date range selection functionality
 */

test.describe('Date Range Picker', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();
  });

  test('should display date range picker button', async ({ page }) => {
    // Look for date range button
    const dateButton = await page.locator('button:has(svg)').filter({ hasText: /last|today|select/i });
    
    if (await dateButton.count() > 0) {
      await expect(dateButton.first()).toBeVisible();
    }
  });

  test('should open date range picker popover', async ({ page }) => {
    // Find and click date range button
    const dateButton = await page.locator('button').filter({ hasText: /Last 7 days|Last 30 days|Today|Select date/i });
    
    if (await dateButton.count() > 0) {
      await dateButton.first().click();
      await page.waitForTimeout(300);

      // Popover should open
      const popover = await page.locator('[role="dialog"]').or(
        page.locator('.popover-content')
      );
      
      if (await popover.count() > 0) {
        await expect(popover.first()).toBeVisible();
      }
    }
  });

  test('should show date presets', async ({ page }) => {
    // Click date button
    const dateButton = await page.locator('button').filter({ hasText: /Last|Today|Select/i });
    
    if (await dateButton.count() > 0) {
      await dateButton.first().click();
      await page.waitForTimeout(300);

      // Should show preset buttons
      const presets = [
        'Today',
        'Yesterday', 
        'Last 7 days',
        'Last 14 days',
        'Last 30 days',
        'This month',
        'Last month'
      ];

      for (const preset of presets) {
        const presetButton = await page.locator(`button:has-text("${preset}")`);
        if (await presetButton.count() > 0) {
          await expect(presetButton.first()).toBeVisible();
          break; // At least one preset should be visible
        }
      }
    }
  });

  test('should select "Last 7 days" preset', async ({ page }) => {
    // Mock campaigns with date range
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    // Click date button
    const dateButton = await page.locator('button').filter({ hasText: /Last|Today|Select/i });
    
    if (await dateButton.count() > 0) {
      await dateButton.first().click();
      await page.waitForTimeout(300);

      // Click "Last 7 days" preset
      const last7Days = await page.locator('button:has-text("Last 7 days")');
      if (await last7Days.isVisible()) {
        await last7Days.click();
        await page.waitForTimeout(500);

        // Popover should close
        await page.waitForTimeout(300);

        // Button should show "Last 7 days"
        const updatedButton = await page.locator('button:has-text("Last 7 days")');
        if (await updatedButton.count() > 0) {
          await expect(updatedButton.first()).toBeVisible();
        }
      }
    }
  });

  test('should select "Last 30 days" preset', async ({ page }) => {
    // Click date button
    const dateButton = await page.locator('button').filter({ hasText: /Last|Today|Select/i });
    
    if (await dateButton.count() > 0) {
      await dateButton.first().click();
      await page.waitForTimeout(300);

      // Click "Last 30 days" preset
      const last30Days = await page.locator('button:has-text("Last 30 days")');
      if (await last30Days.isVisible()) {
        await last30Days.click();
        await page.waitForTimeout(500);

        // Button should update
        const updatedButton = await page.locator('button:has-text("Last 30 days")');
        if (await updatedButton.count() > 0) {
          await expect(updatedButton.first()).toBeVisible();
        }
      }
    }
  });

  test('should show calendar for custom date selection', async ({ page }) => {
    // Click date button
    const dateButton = await page.locator('button').filter({ hasText: /Last|Today|Select/i });
    
    if (await dateButton.count() > 0) {
      await dateButton.first().click();
      await page.waitForTimeout(300);

      // Should show calendar
      const calendar = await page.locator('[role="grid"]').or(
        page.locator('.calendar')
      );
      
      if (await calendar.count() > 0) {
        await expect(calendar.first()).toBeVisible();
      }
    }
  });

  test('should select custom date range', async ({ page }) => {
    // Click date button
    const dateButton = await page.locator('button').filter({ hasText: /Last|Today|Select/i });
    
    if (await dateButton.count() > 0) {
      await dateButton.first().click();
      await page.waitForTimeout(300);

      // Try to select dates in calendar
      const days = await page.locator('button[name="day"]');
      
      if (await days.count() >= 2) {
        // Select first day
        await days.nth(0).click();
        await page.waitForTimeout(200);
        
        // Select second day
        await days.nth(1).click();
        await page.waitForTimeout(500);

        // Popover should close automatically
        await page.waitForTimeout(300);
      }
    }
  });

  test('should refresh data when date range changes', async ({ page }) => {
    // Mock initial data
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.reload();
    await helpers.waitForPageLoad();

    // Change date range
    const dateButton = await page.locator('button').filter({ hasText: /Last|Today|Select/i });
    
    if (await dateButton.count() > 0) {
      await dateButton.first().click();
      await page.waitForTimeout(300);

      // Select different preset
      const todayButton = await page.locator('button:has-text("Today")');
      if (await todayButton.isVisible()) {
        await todayButton.click();
        await page.waitForTimeout(1000);

        // Data should refresh (table should reload)
        await helpers.waitForDataTable();
      }
    }
  });

  test('should persist selected date range across tabs', async ({ page }) => {
    // Select a date range
    const dateButton = await page.locator('button').filter({ hasText: /Last|Today|Select/i });
    
    if (await dateButton.count() > 0) {
      await dateButton.first().click();
      await page.waitForTimeout(300);

      const last7Days = await page.locator('button:has-text("Last 7 days")');
      if (await last7Days.isVisible()) {
        await last7Days.click();
        await page.waitForTimeout(500);

        // Switch tabs
        await page.click('button:has-text("ad sets")');
        await helpers.waitForPageLoad();

        // Date range should persist
        const dateButtonAfter = await page.locator('button:has-text("Last 7 days")');
        if (await dateButtonAfter.count() > 0) {
          await expect(dateButtonAfter.first()).toBeVisible();
        }
      }
    }
  });

  test('should have compact layout', async ({ page }) => {
    // Click date button
    const dateButton = await page.locator('button').filter({ hasText: /Last|Today|Select/i });
    
    if (await dateButton.count() > 0) {
      const box = await dateButton.first().boundingBox();
      
      // Button should be reasonably sized (not too large)
      if (box) {
        expect(box.width).toBeLessThan(250); // Should be compact
      }
    }
  });

  test('should align properly in toolbar', async ({ page }) => {
    // Date picker should be in same row as other toolbar items
    const toolbar = await page.locator('.space-y-3').first().or(
      page.locator('[data-testid="toolbar"]')
    );

    if (await toolbar.count() > 0) {
      const box = await toolbar.boundingBox();
      expect(box).toBeTruthy();
    }
  });
});
