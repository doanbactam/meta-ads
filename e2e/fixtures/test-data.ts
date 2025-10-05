/**
 * Test data fixtures for E2E tests
 * Centralized test data to maintain consistency across tests
 */

export const testUsers = {
  validUser: {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'WrongPassword123!',
  },
};

export const testAdAccounts = {
  validAccount: {
    id: 'test-ad-account-1',
    name: 'Test Ad Account',
    platform: 'Facebook',
  },
  expiredTokenAccount: {
    id: 'test-ad-account-2',
    name: 'Expired Token Account',
    platform: 'Facebook',
  },
};

export const testCampaigns = {
  activeCampaign: {
    id: 'campaign-1',
    name: 'Test Campaign Active',
    status: 'ACTIVE',
    budget: 1000,
    spent: 500,
  },
  pausedCampaign: {
    id: 'campaign-2',
    name: 'Test Campaign Paused',
    status: 'PAUSED',
    budget: 2000,
    spent: 100,
  },
};

export const testAdSets = {
  activeAdSet: {
    id: 'adset-1',
    name: 'Test Ad Set Active',
    status: 'ACTIVE',
    budget: 500,
  },
  pausedAdSet: {
    id: 'adset-2',
    name: 'Test Ad Set Paused',
    status: 'PAUSED',
    budget: 300,
  },
};

export const testAds = {
  activeAd: {
    id: 'ad-1',
    name: 'Test Ad Active',
    status: 'ACTIVE',
    impressions: 10000,
    clicks: 500,
  },
  pausedAd: {
    id: 'ad-2',
    name: 'Test Ad Paused',
    status: 'PAUSED',
    impressions: 5000,
    clicks: 200,
  },
};

export const testDateRanges = {
  last7Days: {
    label: 'Last 7 days',
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  },
  last30Days: {
    label: 'Last 30 days',
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  },
  custom: {
    from: new Date('2024-01-01'),
    to: new Date('2024-01-31'),
  },
};

export const selectors = {
  // Layout
  header: 'header',
  sidebar: '[data-testid="sidebar"]',
  mainContent: 'main',
  
  // Navigation
  adAccountSelector: 'select[aria-label="Ad Account"]',
  refreshButton: 'button[aria-label="Refresh"]',
  
  // Tables
  dataTable: '[data-testid="data-table"]',
  tableRow: '[data-testid="table-row"]',
  tableHeader: '[data-testid="table-header"]',
  pagination: '[data-testid="pagination"]',
  
  // Buttons
  createButton: 'button:has-text("new")',
  editButton: 'button:has-text("edit")',
  deleteButton: 'button:has-text("remove")',
  duplicateButton: 'button:has-text("duplicate")',
  
  // Facebook
  connectFacebookButton: 'button:has-text("Connect Facebook")',
  facebookDialog: '[role="dialog"]',
  accessTokenInput: 'input[type="password"]',
  
  // Date Picker
  dateRangePicker: '[data-testid="date-range-picker"]',
  datePreset: '[data-testid="date-preset"]',
  
  // Search
  searchInput: 'input[placeholder*="search"]',
  
  // Notifications
  toast: '[data-sonner-toast]',
  toastSuccess: '[data-sonner-toast][data-type="success"]',
  toastError: '[data-sonner-toast][data-type="error"]',
  toastLoading: '[data-sonner-toast][data-type="loading"]',
  
  // Tabs
  campaignsTab: 'button:has-text("campaigns")',
  adSetsTab: 'button:has-text("ad sets")',
  adsTab: 'button:has-text("ads")',
};
