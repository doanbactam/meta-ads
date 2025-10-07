import { PrismaClient } from '@prisma/client';
import { deleteToken } from './token-storage';
import { FACEBOOK_ERROR_CODES } from './facebook-api';

/**
 * Token Revocation Handler
 * 
 * Detects and handles token revocation from Facebook API errors
 * and provides mechanisms to clear revoked tokens.
 * 
 * Requirements: 8.4, 8.6 - Detect token revocation and handle gracefully
 */

const prisma = new PrismaClient();

// Error codes that indicate token revocation or invalidation
const TOKEN_REVOCATION_ERROR_CODES = [
  FACEBOOK_ERROR_CODES.INVALID_TOKEN, // 190 - Token is invalid or expired
  FACEBOOK_ERROR_CODES.PERMISSION_DENIED, // 200 - Permission denied (may indicate revoked permissions)
  463, // Session has been invalidated
  467, // Session has expired
];

// Error messages that indicate token revocation
const TOKEN_REVOCATION_MESSAGES = [
  'invalid oauth access token',
  'session has been invalidated',
  'session has expired',
  'user has not authorized application',
  'token has been revoked',
  'token is invalid',
  'oauth access token has expired',
  'the user has not granted permission',
];

export interface TokenRevocationInfo {
  isRevoked: boolean;
  reason?: string;
  errorCode?: number;
  shouldReauthenticate: boolean;
}

/**
 * Check if an error indicates token revocation
 */
export function isTokenRevocationError(error: any): TokenRevocationInfo {
  // Check error code
  const errorCode = error?.code || error?.error?.code;
  if (errorCode && TOKEN_REVOCATION_ERROR_CODES.includes(errorCode)) {
    return {
      isRevoked: true,
      reason: 'Token has been revoked or is invalid',
      errorCode,
      shouldReauthenticate: true,
    };
  }
  
  // Check error message
  const errorMessage = (error?.message || error?.error?.message || '').toLowerCase();
  const hasRevocationMessage = TOKEN_REVOCATION_MESSAGES.some(msg => 
    errorMessage.includes(msg)
  );
  
  if (hasRevocationMessage) {
    return {
      isRevoked: true,
      reason: 'Token has been revoked or permissions removed',
      errorCode,
      shouldReauthenticate: true,
    };
  }
  
  return {
    isRevoked: false,
    shouldReauthenticate: false,
  };
}

/**
 * Handle token revocation for an ad account
 * Clears the token and updates account status
 */
export async function handleTokenRevocation(
  adAccountId: string,
  reason?: string
): Promise<void> {
  try {
    console.log(`Handling token revocation for account ${adAccountId}: ${reason || 'Unknown reason'}`);
    
    // Delete token from database
    await deleteToken(adAccountId);
    
    // Update account status
    await prisma.adAccount.update({
      where: { id: adAccountId },
      data: {
        status: 'DISABLED',
        syncStatus: 'ERROR',
        syncError: reason || 'Token has been revoked. Please reconnect your Facebook account.',
        lastSyncedAt: new Date(),
      },
    });
    
    console.log(`✓ Token revocation handled for account ${adAccountId}`);
  } catch (error) {
    console.error(`Failed to handle token revocation for account ${adAccountId}:`, error);
    throw error;
  }
}

/**
 * Handle token revocation from API error
 * Detects revocation and triggers cleanup
 */
export async function handleTokenRevocationFromError(
  adAccountId: string,
  error: any
): Promise<boolean> {
  const revocationInfo = isTokenRevocationError(error);
  
  if (revocationInfo.isRevoked) {
    await handleTokenRevocation(adAccountId, revocationInfo.reason);
    return true;
  }
  
  return false;
}

/**
 * Check if an ad account's token has been revoked
 * by attempting to validate it
 */
export async function checkTokenRevocation(
  adAccountId: string
): Promise<TokenRevocationInfo> {
  try {
    const account = await prisma.adAccount.findUnique({
      where: { id: adAccountId },
      select: {
        facebookAccessToken: true,
      },
    });
    
    if (!account?.facebookAccessToken) {
      return {
        isRevoked: true,
        reason: 'No token found',
        shouldReauthenticate: true,
      };
    }
    
    // Try to validate token
    const { FacebookMarketingAPI } = await import('./facebook-api');
    const api = new FacebookMarketingAPI(account.facebookAccessToken);
    
    try {
      const validation = await api.validateToken();
      
      if (!validation.isValid) {
        return {
          isRevoked: true,
          reason: validation.error || 'Token is invalid',
          shouldReauthenticate: true,
        };
      }
      
      return {
        isRevoked: false,
        shouldReauthenticate: false,
      };
    } catch (error) {
      return isTokenRevocationError(error);
    }
  } catch (error) {
    console.error('Failed to check token revocation:', error);
    return {
      isRevoked: false,
      shouldReauthenticate: false,
    };
  }
}

/**
 * Get all ad accounts with revoked tokens
 */
export async function getAccountsWithRevokedTokens(): Promise<
  Array<{
    id: string;
    userId: string;
    name: string;
    reason?: string;
  }>
> {
  try {
    // Get accounts marked as disabled or with sync errors
    const accounts = await prisma.adAccount.findMany({
      where: {
        OR: [
          { status: 'DISABLED' },
          {
            syncStatus: 'ERROR',
            syncError: {
              contains: 'revoked',
            },
          },
        ],
      },
      select: {
        id: true,
        userId: true,
        name: true,
        syncError: true,
      },
    });
    
    return accounts.map(account => ({
      id: account.id,
      userId: account.userId,
      name: account.name,
      reason: account.syncError || undefined,
    }));
  } catch (error) {
    console.error('Failed to get accounts with revoked tokens:', error);
    return [];
  }
}

/**
 * Clear revoked token and prepare for re-authentication
 */
export async function prepareForReauthentication(
  adAccountId: string
): Promise<{
  success: boolean;
  message: string;
  reauthUrl?: string;
}> {
  try {
    // Clear token
    await deleteToken(adAccountId);
    
    // Update account status
    await prisma.adAccount.update({
      where: { id: adAccountId },
      data: {
        status: 'DISABLED',
        syncStatus: 'IDLE',
        syncError: null,
      },
    });
    
    // Generate re-authentication URL
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/facebook/callback`;
    
    const reauthUrl = appId
      ? `https://www.facebook.com/v23.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ads_management,ads_read,business_management&response_type=code`
      : undefined;
    
    return {
      success: true,
      message: 'Account prepared for re-authentication',
      reauthUrl,
    };
  } catch (error) {
    console.error('Failed to prepare for re-authentication:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch check token revocation for multiple accounts
 */
export async function batchCheckTokenRevocation(
  accountIds: string[]
): Promise<
  Array<{
    accountId: string;
    isRevoked: boolean;
    reason?: string;
  }>
> {
  const results = await Promise.all(
    accountIds.map(async (accountId) => {
      const info = await checkTokenRevocation(accountId);
      return {
        accountId,
        isRevoked: info.isRevoked,
        reason: info.reason,
      };
    })
  );
  
  return results;
}

/**
 * Auto-cleanup revoked tokens
 * Should be run periodically to clean up accounts with revoked tokens
 */
export async function cleanupRevokedTokens(): Promise<{
  total: number;
  cleaned: number;
}> {
  const stats = {
    total: 0,
    cleaned: 0,
  };
  
  try {
    // Get all accounts with tokens
    const accounts = await prisma.adAccount.findMany({
      where: {
        facebookAccessToken: {
          not: null,
        },
      },
      select: {
        id: true,
      },
    });
    
    stats.total = accounts.length;
    
    // Check each account
    for (const account of accounts) {
      const info = await checkTokenRevocation(account.id);
      
      if (info.isRevoked) {
        await handleTokenRevocation(account.id, info.reason);
        stats.cleaned++;
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Cleaned up ${stats.cleaned} revoked tokens out of ${stats.total} accounts`);
    
    return stats;
  } catch (error) {
    console.error('Failed to cleanup revoked tokens:', error);
    return stats;
  }
}
