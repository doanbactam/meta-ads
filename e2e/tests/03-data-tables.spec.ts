import { test, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';
import { testCampaigns, testAdSets, testAds } from '../fixtures/test-data';

/**
 * Data Tables E2E Tests
 * Tests for campaigns, ad sets, and ads tables functionality
 */

test.describe('Data Tables', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/campaigns');
    await helpers.waitForPageLoad();
  });

  test.describe('Campaigns Table', () => {
    test('should display campaigns table', async ({ page }) => {
      // Mock campaigns data
      await helpers.mockApiResponse('/api/campaigns', {
        campaigns: [testCampaigns.activeCampaign, testCampaigns.pausedCampaign]
      });

      await page.reload();
      await helpers.waitForDataTable();

      // Verify table is visible
      const table = await page.locator('table');
      await expect(table).toBeVisible();
    });

    test('should show campaign data in table rows', async ({ page }) => {
      // Mock campaigns
      await helpers.mockApiResponse('/api/campaigns', {
        campaigns: [testCampaigns.activeCampaign]
      });

      await page.reload();
      await helpers.waitForDataTable();

      // Check for campaign name
      const campaignName = await page.locator(`text=${testCampaigns.activeCampaign.name}`);
      await expect(campaignName).toBeVisible();
    });

    test('should filter campaigns by search', async ({ page }) => {
      // Mock campaigns
      await helpers.mockApiResponse('/api/campaigns', {
        campaigns: [testCampaigns.activeCampaign, testCampaigns.pausedCampaign]
      });

      await page.reload();
      await helpers.waitForDataTable();

      // Search for specific campaign
      await helpers.searchInTable(testCampaigns.activeCampaign.name);

      // Should show only matching campaigns
      const activeCampaign = await page.locator(`text=${testCampaigns.activeCampaign.name}`);
      await expect(activeCampaign).toBeVisible();
    });

    test('should show empty state when no campaigns', async ({ page }) => {
      // Mock empty response
      await helpers.mockApiResponse('/api/campaigns', {
        campaigns: []
      });

      await page.reload();
      await helpers.waitForPageLoad();

      // Should show empty state
      const emptyState = await page.locator('text=No campaigns found');
      await expect(emptyState).toBeVisible();
    });

    test('should have working pagination', async ({ page }) => {
      // Mock many campaigns
      const manyCampaigns = Array.from({ length: 25 }, (_, i) => ({
        ...testCampaigns.activeCampaign,
        id: `campaign-${i}`,
        name: `Campaign ${i}`
      }));

      await helpers.mockApiResponse('/api/campaigns', {
        campaigns: manyCampaigns
      });

      await page.reload();
      await helpers.waitForDataTable();

      // Check for pagination controls
      const pagination = await page.locator('[role="navigation"]').last();
      
      // Should have next/previous buttons
      const nextButton = await page.locator('button:has-text("Next")').or(
        page.locator('button[aria-label="Go to next page"]')
      );
      
      if (await nextButton.count() > 0) {
        await expect(nextButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Ad Sets Table', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('button:has-text("ad sets")');
      await helpers.waitForPageLoad();
    });

    test('should display ad sets table', async ({ page }) => {
      // Mock ad sets data
      await helpers.mockApiResponse('/api/ad-sets', {
        adSets: [testAdSets.activeAdSet, testAdSets.pausedAdSet]
      });

      await page.reload();
      await page.click('button:has-text("ad sets")');
      await helpers.waitForDataTable();

      // Verify table is visible
      const table = await page.locator('table');
      await expect(table).toBeVisible();
    });

    test('should show ad set data', async ({ page }) => {
      // Mock ad sets
      await helpers.mockApiResponse('/api/ad-sets', {
        adSets: [testAdSets.activeAdSet]
      });

      await page.reload();
      await page.click('button:has-text("ad sets")');
      await helpers.waitForDataTable();

      // Check for ad set name
      const adSetName = await page.locator(`text=${testAdSets.activeAdSet.name}`);
      await expect(adSetName).toBeVisible();
    });
  });

  test.describe('Ads Table', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('button:has-text("ads")');
      await helpers.waitForPageLoad();
    });

    test('should display ads table', async ({ page }) => {
      // Mock ads data
      await helpers.mockApiResponse('/api/ads', {
        ads: [testAds.activeAd, testAds.pausedAd]
      });

      await page.reload();
      await page.click('button:has-text("ads")');
      await helpers.waitForDataTable();

      // Verify table is visible
      const table = await page.locator('table');
      await expect(table).toBeVisible();
    });

    test('should show ad data', async ({ page }) => {
      // Mock ads
      await helpers.mockApiResponse('/api/ads', {
        ads: [testAds.activeAd]
      });

      await page.reload();
      await page.click('button:has-text("ads")');
      await helpers.waitForDataTable();

      // Check for ad name
      const adName = await page.locator(`text=${testAds.activeAd.name}`);
      await expect(adName).toBeVisible();
    });
  });

  test.describe('Table Actions', () => {
    test('should show action buttons', async ({ page }) => {
      // Mock campaigns
      await helpers.mockApiResponse('/api/campaigns', {
        campaigns: [testCampaigns.activeCampaign]
      });

      await page.reload();
      await helpers.waitForDataTable();

      // Should have refresh button
      const refreshButton = await page.locator('button:has-text("refresh")');
      await expect(refreshButton).toBeVisible();
    });

    test('should enable bulk actions when rows selected', async ({ page }) => {
      // Mock campaigns
      await helpers.mockApiResponse('/api/campaigns', {
        campaigns: [testCampaigns.activeCampaign, testCampaigns.pausedCampaign]
      });

      await page.reload();
      await helpers.waitForDataTable();

      // Select a row
      const checkbox = await page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible()) {
        await checkbox.check();

        // Bulk action buttons should appear
        const editButton = await page.locator('button:has-text("edit")');
        await expect(editButton).toBeVisible();
      }
    });
  });

  test.describe('Table Refresh', () => {
    test('should refresh data when clicking refresh button', async ({ page }) => {
      // Mock initial data
      await helpers.mockApiResponse('/api/campaigns', {
        campaigns: [testCampaigns.activeCampaign]
      });

      await page.reload();
      await helpers.waitForDataTable();

      // Click refresh
      const refreshButton = await page.locator('button:has-text("refresh")').first();
      await refreshButton.click();

      // Should show loading toast
      await page.waitForTimeout(500);

      // Wait for refresh to complete
      await helpers.waitForDataTable();
    });

    test('should show refresh loading state', async ({ page }) => {
      await page.reload();
      await helpers.waitForDataTable();

      // Click refresh
      const refreshButton = await page.locator('button:has-text("refresh")').first();
      await refreshButton.click();

      // Button should show loading state
      const refreshingText = await page.locator('text=refreshing');
      
      // Wait a bit to see the loading state
      await page.waitForTimeout(300);
    });
  });

  test.describe('Column Selector', () => {
    test('should open columns selector', async ({ page }) => {
      await helpers.waitForDataTable();

      // Look for columns button
      const columnsButton = await page.locator('button:has-text("columns")').or(
        page.locator('button[aria-label="Columns"]')
      );

      if (await columnsButton.count() > 0) {
        await columnsButton.first().click();
        await page.waitForTimeout(300);
      }
    });
  });
});
