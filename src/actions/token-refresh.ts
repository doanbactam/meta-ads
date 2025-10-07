'use server';

import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { tokenManager } from '@/features/facebook/auth';

/**
 * Server Actions for Token Refresh
 * 
 * Provides user-facing actions to manually refresh tokens
 * and check token status.
 * 
 * Requirements: 8.3, 8.7 - Handle refresh failures gracefully
 * 
 * ✨ Updated to use new TokenManager
 */

const prisma = new PrismaClient();

/**
 * Manually refresh token for an ad account
 */
export async function refreshAdAccountTokenAction(
  adAccountId: string
): Promise<{
  success: boolean;
  message: string;
  newExpiresAt?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }
    
    // Verify user owns this ad account
    const adAccount = await prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId,
      },
    });
    
    if (!adAccount) {
      return {
        success: false,
        message: 'Ad account not found',
      };
    }
    
    // Refresh token using new TokenManager
    const result = await tokenManager.refresh(adAccountId);
    
    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Token refresh failed',
      };
    }
    
    return {
      success: true,
      message: 'Token refreshed successfully',
      newExpiresAt: result.newExpiresAt?.toISOString(),
    };
  } catch (error) {
    console.error('Token refresh action failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get token refresh status for an ad account
 */
export async function getTokenStatusAction(
  adAccountId: string
): Promise<{
  success: boolean;
  needsRefresh: boolean;
  daysUntilExpiry?: number;
  expiresAt?: string;
  isExpired: boolean;
  message?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        needsRefresh: false,
        isExpired: false,
        message: 'Unauthorized',
      };
    }
    
    // Verify user owns this ad account
    const adAccount = await prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId,
      },
    });
    
    if (!adAccount) {
      return {
        success: false,
        needsRefresh: false,
        isExpired: false,
        message: 'Ad account not found',
      };
    }
    
    // Get token status using new TokenManager
    const account = await prisma.adAccount.findUnique({
      where: { id: adAccountId },
      select: { facebookTokenExpiry: true },
    });
    
    if (!account?.facebookTokenExpiry) {
      return {
        success: true,
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
      success: true,
      needsRefresh,
      daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,
      expiresAt: expiresAt.toISOString(),
      isExpired,
    };
  } catch (error) {
    console.error('Get token status action failed:', error);
    return {
      success: false,
      needsRefresh: false,
      isExpired: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Refresh all tokens for current user's ad accounts
 */
export async function refreshAllUserTokensAction(): Promise<{
  success: boolean;
  message: string;
  results?: Array<{
    accountId: string;
    accountName: string;
    success: boolean;
    error?: string;
  }>;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        message: 'Unauthorized',
      };
    }
    
    // Get all user's ad accounts with expiring tokens
    const adAccounts = await prisma.adAccount.findMany({
      where: {
        userId,
        facebookAccessToken: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        facebookTokenExpiry: true,
      },
    });
    
    if (adAccounts.length === 0) {
      return {
        success: true,
        message: 'No ad accounts found',
        results: [],
      };
    }
    
    // Filter accounts that need refresh (< 7 days until expiry)
    const accountsNeedingRefresh = adAccounts.filter(account => {
      if (!account.facebookTokenExpiry) return false;
      
      const daysUntilExpiry = Math.floor(
        (account.facebookTokenExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    });
    
    if (accountsNeedingRefresh.length === 0) {
      return {
        success: true,
        message: 'No tokens need refreshing',
        results: [],
      };
    }
    
    // Refresh each account using new TokenManager
    const results = await Promise.all(
      accountsNeedingRefresh.map(async (account) => {
        const result = await tokenManager.refresh(account.id);
        return {
          accountId: account.id,
          accountName: account.name,
          success: result.success,
          error: result.error,
        };
      })
    );
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    return {
      success: true,
      message: `Refreshed ${successCount} tokens successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results,
    };
  } catch (error) {
    console.error('Refresh all tokens action failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
