import { PrismaClient } from '@prisma/client';
import { getAccountsWithExpiringTokens, updateToken } from './token-storage';
import { FacebookMarketingAPI } from './facebook-api';

/**
 * Token Refresh Service
 * 
 * Provides proactive token refresh functionality to ensure tokens
 * are refreshed before they expire.
 * 
 * Requirements: 8.3, 8.7 - Implement proactive token refresh
 */

const prisma = new PrismaClient();

export interface TokenRefreshResult {
  accountId: string;
  success: boolean;
  error?: string;
  newExpiresAt?: Date;
}

export interface TokenRefreshStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: TokenRefreshResult[];
}

/**
 * Exchange short-lived token for long-lived token
 * Facebook tokens can be extended from 1 hour to 60 days
 */
async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
  try {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!appId || !appSecret) {
      console.error('Facebook app credentials not configured');
      return null;
    }
    
    const url = new URL('https://graph.facebook.com/v23.0/oauth/access_token');
    url.searchParams.set('grant_type', 'fb_exchange_token');
    url.searchParams.set('client_id', appId);
    url.searchParams.set('client_secret', appSecret);
    url.searchParams.set('fb_exchange_token', shortLivedToken);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Token exchange failed:', error);
      return null;
    }
    
    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 5184000, // Default 60 days
    };
  } catch (error) {
    console.error('Token exchange error:', error);
    return null;
  }
}

/**
 * Refresh token for a single ad account
 */
export async function refreshTokenForAccount(
  accountId: string
): Promise<TokenRefreshResult> {
  try {
    // Get current token
    const account = await prisma.adAccount.findUnique({
      where: { id: accountId },
      select: {
        facebookAccessToken: true,
        facebookTokenExpiry: true,
      },
    });
    
    if (!account?.facebookAccessToken) {
      return {
        accountId,
        success: false,
        error: 'No token found',
      };
    }
    
    // Check if token is already long-lived (> 30 days until expiry)
    if (account.facebookTokenExpiry) {
      const daysUntilExpiry = Math.floor(
        (account.facebookTokenExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilExpiry > 30) {
        return {
          accountId,
          success: true,
          error: 'Token already long-lived, no refresh needed',
        };
      }
    }
    
    // Validate current token first
    const api = new FacebookMarketingAPI(account.facebookAccessToken);
    const validation = await api.validateToken();
    
    if (!validation.isValid) {
      return {
        accountId,
        success: false,
        error: 'Current token is invalid, cannot refresh',
      };
    }
    
    // Exchange for long-lived token
    const exchangeResult = await exchangeForLongLivedToken(account.facebookAccessToken);
    
    if (!exchangeResult) {
      return {
        accountId,
        success: false,
        error: 'Token exchange failed',
      };
    }
    
    // Calculate new expiry date
    const newExpiresAt = new Date(Date.now() + exchangeResult.expiresIn * 1000);
    
    // Save new token
    await updateToken(accountId, exchangeResult.accessToken, newExpiresAt);
    
    console.log(`✓ Token refreshed for account ${accountId}, expires at ${newExpiresAt.toISOString()}`);
    
    return {
      accountId,
      success: true,
      newExpiresAt,
    };
  } catch (error) {
    console.error(`Failed to refresh token for account ${accountId}:`, error);
    return {
      accountId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Refresh tokens for all accounts with expiring tokens
 * Requirements: 8.3 - Trigger refresh when token < 7 days to expiry
 */
export async function refreshExpiringTokens(
  daysUntilExpiry: number = 7
): Promise<TokenRefreshStats> {
  const stats: TokenRefreshStats = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    results: [],
  };
  
  try {
    // Get accounts with expiring tokens
    const accounts = await getAccountsWithExpiringTokens(daysUntilExpiry);
    stats.total = accounts.length;
    
    if (accounts.length === 0) {
      console.log('No tokens need refreshing');
      return stats;
    }
    
    console.log(`Found ${accounts.length} accounts with tokens expiring within ${daysUntilExpiry} days`);
    
    // Refresh each account
    for (const account of accounts) {
      const result = await refreshTokenForAccount(account.id);
      stats.results.push(result);
      
      if (result.success) {
        if (result.error?.includes('already long-lived')) {
          stats.skipped++;
        } else {
          stats.successful++;
        }
      } else {
        stats.failed++;
      }
      
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Token refresh complete: ${stats.successful} successful, ${stats.failed} failed, ${stats.skipped} skipped`);
    
    return stats;
  } catch (error) {
    console.error('Token refresh batch failed:', error);
    return stats;
  }
}

/**
 * Check if a token needs refresh
 */
export async function shouldRefreshToken(accountId: string): Promise<boolean> {
  try {
    const account = await prisma.adAccount.findUnique({
      where: { id: accountId },
      select: {
        facebookTokenExpiry: true,
      },
    });
    
    if (!account?.facebookTokenExpiry) {
      return false;
    }
    
    const daysUntilExpiry = Math.floor(
      (account.facebookTokenExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    // Refresh if less than 7 days until expiry
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  } catch (error) {
    console.error('Failed to check token refresh status:', error);
    return false;
  }
}

/**
 * Get token refresh status for an account
 */
export async function getTokenRefreshStatus(accountId: string): Promise<{
  needsRefresh: boolean;
  daysUntilExpiry?: number;
  expiresAt?: Date;
  isExpired: boolean;
}> {
  try {
    const account = await prisma.adAccount.findUnique({
      where: { id: accountId },
      select: {
        facebookTokenExpiry: true,
      },
    });
    
    if (!account?.facebookTokenExpiry) {
      return {
        needsRefresh: false,
        isExpired: false,
      };
    }
    
    const now = Date.now();
    const expiresAt = account.facebookTokenExpiry;
    const daysUntilExpiry = Math.floor(
      (expiresAt.getTime() - now) / (1000 * 60 * 60 * 24)
    );
    
    const isExpired = expiresAt.getTime() < now;
    const needsRefresh = daysUntilExpiry <= 7 && !isExpired;
    
    return {
      needsRefresh,
      daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,
      expiresAt,
      isExpired,
    };
  } catch (error) {
    console.error('Failed to get token refresh status:', error);
    return {
      needsRefresh: false,
      isExpired: false,
    };
  }
}

/**
 * Schedule automatic token refresh
 * This should be called by a cron job or background worker
 */
export async function scheduleTokenRefresh(): Promise<void> {
  console.log('Starting scheduled token refresh...');
  
  try {
    const stats = await refreshExpiringTokens(7);
    
    // Log results
    console.log('Scheduled token refresh completed:', {
      total: stats.total,
      successful: stats.successful,
      failed: stats.failed,
      skipped: stats.skipped,
    });
    
    // Alert if there are failures
    if (stats.failed > 0) {
      console.error(`⚠️ ${stats.failed} token refresh failures detected`);
      // TODO: Send alert to monitoring system
    }
  } catch (error) {
    console.error('Scheduled token refresh failed:', error);
    // TODO: Send alert to monitoring system
  }
}
