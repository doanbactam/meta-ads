import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Authentication setup for E2E tests
 * This file handles the authentication state that will be reused across tests
 */

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Note: Since we're using Clerk, you'll need to configure test credentials
  // For now, this is a placeholder that shows the structure
  
  // Navigate to sign-in page
  await page.goto('/sign-in');
  
  // Wait for the sign-in form to be visible
  await page.waitForSelector('[data-clerk-element="signIn"]', { timeout: 30000 });
  
  // TODO: Add actual sign-in flow with test credentials
  // This will depend on your Clerk configuration
  // Example:
  // await page.fill('input[name="identifier"]', process.env.TEST_USER_EMAIL!);
  // await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!);
  // await page.click('button[type="submit"]');
  
  // Wait for successful authentication
  // await page.waitForURL('/dashboard', { timeout: 30000 });
  
  // Save signed-in state
  await page.context().storageState({ path: authFile });
});
