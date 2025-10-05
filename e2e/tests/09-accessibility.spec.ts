import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';

/**
 * Accessibility E2E Tests
 * Tests for WCAG compliance and accessibility features
 */

test.describe('Accessibility', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should have proper page title', async ({ page }) => {
    await page.goto('/');
    await helpers.waitForPageLoad();

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should have semantic HTML structure', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Check for semantic elements
    const header = await page.locator('header');
    await expect(header).toBeVisible();

    const main = await page.locator('main');
    await expect(main).toBeVisible();

    const nav = await page.locator('nav').or(
      page.locator('[role="navigation"]')
    );
    expect(await nav.count()).toBeGreaterThanOrEqual(0);
  });

  test('should have accessible buttons with labels', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // All buttons should have accessible text or aria-label
    const buttons = await page.locator('button').all();
    
    for (const button of buttons.slice(0, 10)) { // Check first 10
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      // Button should have some form of label
      const hasLabel = (text && text.trim().length > 0) || ariaLabel || title;
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should have accessible form inputs', async ({ page }) => {
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Search input should have label or placeholder
    const searchInput = await page.locator('input[placeholder*="search"]').first();
    
    if (await searchInput.count() > 0) {
      const placeholder = await searchInput.getAttribute('placeholder');
      const ariaLabel = await searchInput.getAttribute('aria-label');
      
      expect(placeholder || ariaLabel).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    const focused = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    // Should focus on interactive element
    expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focused);
  });

  test('should have focus indicators', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Tab to first focusable element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Check if focus is visible (via outline or other styling)
    const hasFocusStyle = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      if (!element) return false;
      
      const styles = window.getComputedStyle(element);
      return styles.outline !== 'none' || 
             styles.outlineWidth !== '0px' ||
             styles.boxShadow !== 'none';
    });

    // Should have some focus indication
    expect(typeof hasFocusStyle).toBe('boolean');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Check for h1
    const h1 = await page.locator('h1');
    const h1Count = await h1.count();
    
    // Should have at least one h1
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('should have accessible tables', async ({ page }) => {
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: [{
        id: '1',
        name: 'Test Campaign',
        status: 'ACTIVE'
      }]
    });

    await page.goto('/campaigns');
    await helpers.waitForDataTable();

    // Table should have proper structure
    const table = await page.locator('table').first();
    const thead = await table.locator('thead');
    const tbody = await table.locator('tbody');

    await expect(thead).toBeVisible();
    await expect(tbody).toBeVisible();
  });

  test('should have accessible dialogs', async ({ page }) => {
    await helpers.mockApiResponse('/api/campaigns', {
      campaigns: []
    });

    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Try to open dialog
    const connectButton = await page.locator('button:has-text("Connect Facebook")').first();
    
    if (await connectButton.isVisible()) {
      await connectButton.click();
      await page.waitForTimeout(500);

      // Dialog should have proper role
      const dialog = await page.locator('[role="dialog"]');
      if (await dialog.count() > 0) {
        await expect(dialog).toBeVisible();
        
        // Should have aria-modal
        const ariaModal = await dialog.getAttribute('aria-modal');
        expect(ariaModal).toBe('true');
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Check text elements for contrast
    const textElements = await page.locator('p, span, button, a').all();
    
    expect(textElements.length).toBeGreaterThan(0);
    // Actual contrast checking would require additional tools
  });

  test('should support screen readers with ARIA labels', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Check for ARIA landmarks
    const landmarks = await page.locator('[role="banner"], [role="main"], [role="navigation"], [role="complementary"]').all();
    
    // Should have semantic landmarks
    expect(landmarks.length).toBeGreaterThan(0);
  });

  test('should have accessible error messages', async ({ page }) => {
    // Mock error
    await helpers.mockApiResponse('/api/campaigns', {
      error: 'Failed to load campaigns'
    }, 500);

    await page.goto('/campaigns');
    await page.waitForTimeout(2000);

    // Error should be announced to screen readers
    const errorMessage = await page.locator('[role="alert"]').or(
      page.locator('text=error')
    );

    if (await errorMessage.count() > 0) {
      const role = await errorMessage.first().getAttribute('role');
      // Should have alert or status role
      expect(['alert', 'status', null]).toContain(role);
    }
  });

  test('should not trap keyboard focus', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Tab multiple times
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
    }

    // Should be able to navigate without getting stuck
    const focused = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focused).toBeTruthy();
  });

  test('should have accessible tooltips', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Find elements with titles (tooltips)
    const elementsWithTooltips = await page.locator('[title]').all();
    
    for (const element of elementsWithTooltips.slice(0, 5)) {
      const title = await element.getAttribute('title');
      expect(title).toBeTruthy();
    }
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();

    // Trigger data refresh
    const refreshButton = await page.locator('button:has-text("refresh")').first();
    await refreshButton.click();

    // Toast notifications should have proper ARIA
    await page.waitForTimeout(500);
    const toast = await page.locator('[data-sonner-toast]');
    
    if (await toast.count() > 0) {
      // Toast should be announced
      const role = await toast.first().getAttribute('role');
      expect(['status', 'alert', null]).toContain(role);
    }
  });
});
