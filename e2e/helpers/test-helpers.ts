import { Page, expect } from '@playwright/test';
import { selectors } from '../fixtures/test-data';

/**
 * Helper functions for E2E tests
 * Reusable utilities to reduce code duplication
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for and verify toast notification
   */
  async waitForToast(type: 'success' | 'error' | 'loading', message?: string) {
    const toastSelector = type === 'success' 
      ? selectors.toastSuccess 
      : type === 'error' 
      ? selectors.toastError 
      : selectors.toastLoading;
    
    const toast = await this.page.waitForSelector(toastSelector, { 
      timeout: 10000,
      state: 'visible' 
    });
    
    if (message) {
      const toastText = await toast.textContent();
      expect(toastText).toContain(message);
    }
    
    return toast;
  }

  /**
   * Select ad account from header
   */
  async selectAdAccount(accountName: string) {
    await this.page.click(selectors.adAccountSelector);
    await this.page.click(`text=${accountName}`);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to specific tab
   */
  async navigateToTab(tab: 'campaigns' | 'ad-sets' | 'ads') {
    const tabSelector = tab === 'campaigns' 
      ? selectors.campaignsTab 
      : tab === 'ad-sets' 
      ? selectors.adSetsTab 
      : selectors.adsTab;
    
    await this.page.click(tabSelector);
    await this.waitForPageLoad();
  }

  /**
   * Wait for data table to load
   */
  async waitForDataTable() {
    await this.page.waitForSelector('table', { timeout: 30000 });
    // Wait for loading state to disappear
    await this.page.waitForSelector('text=Loading', { state: 'hidden', timeout: 30000 });
  }

  /**
   * Search in data table
   */
  async searchInTable(query: string) {
    await this.page.fill(selectors.searchInput, query);
    await this.page.waitForTimeout(500); // Debounce
    await this.waitForDataTable();
  }

  /**
   * Get table row count
   */
  async getTableRowCount(): Promise<number> {
    const rows = await this.page.$$('tbody tr');
    return rows.length;
  }

  /**
   * Click refresh button and wait for completion
   */
  async refreshData() {
    await this.page.click(selectors.refreshButton);
    await this.waitForToast('loading');
    await this.waitForDataTable();
  }

  /**
   * Select date range preset
   */
  async selectDatePreset(presetName: string) {
    await this.page.click(selectors.dateRangePicker);
    await this.page.click(`text=${presetName}`);
    await this.waitForPageLoad();
  }

  /**
   * Open Facebook connect dialog
   */
  async openFacebookConnectDialog() {
    await this.page.click(selectors.connectFacebookButton);
    await this.page.waitForSelector(selectors.facebookDialog, { state: 'visible' });
  }

  /**
   * Fill Facebook access token
   */
  async fillFacebookToken(token: string) {
    await this.page.fill(selectors.accessTokenInput, token);
  }

  /**
   * Select rows in table
   */
  async selectTableRows(count: number) {
    const checkboxes = await this.page.$$('input[type="checkbox"]');
    for (let i = 0; i < Math.min(count, checkboxes.length); i++) {
      await checkboxes[i].check();
    }
  }

  /**
   * Verify toast message appears
   */
  async verifyToastMessage(message: string, type: 'success' | 'error' = 'success') {
    const toast = await this.waitForToast(type, message);
    expect(toast).toBeTruthy();
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, timeout = 10000) {
    return await this.page.waitForSelector(selector, { 
      state: 'visible',
      timeout 
    });
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `e2e/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  /**
   * Mock API response
   */
  async mockApiResponse(endpoint: string, response: any, status = 200) {
    await this.page.route(`**${endpoint}**`, async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }

  /**
   * Mock expired token response
   */
  async mockExpiredTokenResponse() {
    await this.mockApiResponse('/api/campaigns', {
      campaigns: [],
      error: 'Facebook access token has expired. Please reconnect your Facebook account.',
      code: 'TOKEN_EXPIRED'
    }, 401);
  }

  /**
   * Verify URL contains path
   */
  async verifyUrl(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    return (await this.page.$(selector)) !== null;
  }

  /**
   * Get element text content
   */
  async getTextContent(selector: string): Promise<string | null> {
    const element = await this.page.$(selector);
    return element ? await element.textContent() : null;
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetwork() {
    await this.page.waitForLoadState('networkidle');
  }
}
