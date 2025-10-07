'use server';

import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import {
  checkTokenRevocation,
  prepareForReauthentication,
  getAccountsWithRevokedTokens,
  type TokenRevocationInfo,
} from '@/lib/server/token-revocation';

/**
 * Server Actions for Token Revocation
 * 
 * Provides user-facing actions to handle token revocation
 * and trigger re-authentication.
 * 
 * Requirements: 8.4, 8.6 - Trigger re-authentication flow
 */

const prisma = new PrismaClient();

/**
 * Check if an ad account's token has been revoked
 */
export async function checkAdAccountTokenAction(
  adAccountId: string
): Promise<{
  success: boolean;
  isRevoked: boolean;
  reason?: string;
  shouldReauthenticate: boolean;
  message?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        isRevoked: false,
        shouldReauthenticate: false,
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
        isRevoked: false,
        shouldReauthenticate: false,
        message: 'Ad account not found',
      };
    }
    
    // Check token revocation
    const info = await checkTokenRevocation(adAccountId);
    
    return {
      success: true,
      isRevoked: info.isRevoked,
      reason: info.reason,
      shouldReauthenticate: info.shouldReauthenticate,
    };
  } catch (error) {
    console.error('Check token action failed:', error);
    return {
      success: false,
      isRevoked: false,
      shouldReauthenticate: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Prepare ad account for re-authentication
 */
export async function reauthenticateAdAccountAction(
  adAccountId: string
): Promise<{
  success: boolean;
  message: string;
  reauthUrl?: string;
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
    
    // Prepare for re-authentication
    const result = await prepareForReauthentication(adAccountId);
    
    return result;
  } catch (error) {
    console.error('Reauthenticate action failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all ad accounts with revoked tokens for current user
 */
export async function getRevokedAccountsAction(): Promise<{
  success: boolean;
  accounts: Array<{
    id: string;
    name: string;
    reason?: string;
  }>;
  message?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        accounts: [],
        message: 'Unauthorized',
      };
    }
    
    // Get all revoked accounts
    const allRevoked = await getAccountsWithRevokedTokens();
    
    // Filter by current user
    const userRevoked = allRevoked.filter(account => account.userId === userId);
    
    return {
      success: true,
      accounts: userRevoked.map(account => ({
        id: account.id,
        name: account.name,
        reason: account.reason,
      })),
    };
  } catch (error) {
    console.error('Get revoked accounts action failed:', error);
    return {
      success: false,
      accounts: [],
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Disconnect ad account (manually revoke token)
 */
export async function disconnectAdAccountAction(
  adAccountId: string
): Promise<{
  success: boolean;
  message: string;
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
    
    // Import here to avoid circular dependency
    const { handleTokenRevocation } = await import('@/lib/server/token-revocation');
    
    // Handle as revocation
    await handleTokenRevocation(adAccountId, 'User manually disconnected account');
    
    return {
      success: true,
      message: 'Ad account disconnected successfully',
    };
  } catch (error) {
    console.error('Disconnect account action failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
