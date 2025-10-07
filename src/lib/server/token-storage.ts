import { PrismaClient } from '@prisma/client';
import {
  encryptTokenForStorage,
  decryptTokenFromStorage,
  getDecryptedToken,
  isTokenEncrypted,
} from './token-encryption';

/**
 * Token Storage Service
 * 
 * Provides secure storage and retrieval of Facebook access tokens
 * with automatic encryption/decryption.
 * 
 * Requirements: 8.1 - Update database save/load to use encryption
 */

const prisma = new PrismaClient();

export interface TokenData {
  accessToken: string;
  expiresAt?: Date;
  userId?: string;
  businessId?: string;
  scopes?: string[];
}

/**
 * Save encrypted token to database
 */
export async function saveEncryptedToken(
  adAccountId: string,
  token: string,
  expiresAt?: Date
): Promise<void> {
  try {
    const encryptedToken = encryptTokenForStorage(token);
    
    await prisma.adAccount.update({
      where: { id: adAccountId },
      data: {
        facebookAccessToken: encryptedToken,
        facebookTokenExpiry: expiresAt,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to save encrypted token:', error);
    throw new Error('Failed to save token to database');
  }
}

/**
 * Get and decrypt token from database
 */
export async function getDecryptedTokenFromDb(
  adAccountId: string
): Promise<string | null> {
  try {
    const adAccount = await prisma.adAccount.findUnique({
      where: { id: adAccountId },
      select: {
        facebookAccessToken: true,
        facebookTokenExpiry: true,
      },
    });
    
    if (!adAccount?.facebookAccessToken) {
      return null;
    }
    
    // Check if token is expired
    if (adAccount.facebookTokenExpiry && adAccount.facebookTokenExpiry < new Date()) {
      console.warn(`Token for ad account ${adAccountId} has expired`);
      return null;
    }
    
    // Decrypt token (handles both encrypted and plain tokens)
    return getDecryptedToken(adAccount.facebookAccessToken);
  } catch (error) {
    console.error('Failed to get decrypted token:', error);
    throw new Error('Failed to retrieve token from database');
  }
}

/**
 * Update token with encryption
 * Useful for updating existing tokens or refreshing tokens
 */
export async function updateToken(
  adAccountId: string,
  newToken: string,
  expiresAt?: Date
): Promise<void> {
  await saveEncryptedToken(adAccountId, newToken, expiresAt);
}

/**
 * Delete token from database
 * Used when token is revoked or user disconnects
 */
export async function deleteToken(adAccountId: string): Promise<void> {
  try {
    await prisma.adAccount.update({
      where: { id: adAccountId },
      data: {
        facebookAccessToken: null,
        facebookTokenExpiry: null,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to delete token:', error);
    throw new Error('Failed to delete token from database');
  }
}

/**
 * Migrate all plain tokens to encrypted format
 * Run this once to migrate existing tokens
 */
export async function migrateAllTokensToEncrypted(): Promise<{
  total: number;
  migrated: number;
  failed: number;
}> {
  const stats = {
    total: 0,
    migrated: 0,
    failed: 0,
  };
  
  try {
    // Get all ad accounts with tokens
    const adAccounts = await prisma.adAccount.findMany({
      where: {
        facebookAccessToken: {
          not: null,
        },
      },
      select: {
        id: true,
        facebookAccessToken: true,
        facebookTokenExpiry: true,
      },
    });
    
    stats.total = adAccounts.length;
    
    for (const account of adAccounts) {
      if (!account.facebookAccessToken) continue;
      
      try {
        // Skip if already encrypted
        if (isTokenEncrypted(account.facebookAccessToken)) {
          continue;
        }
        
        // Encrypt and save
        const encryptedToken = encryptTokenForStorage(account.facebookAccessToken);
        
        await prisma.adAccount.update({
          where: { id: account.id },
          data: {
            facebookAccessToken: encryptedToken,
            updatedAt: new Date(),
          },
        });
        
        stats.migrated++;
      } catch (error) {
        console.error(`Failed to migrate token for account ${account.id}:`, error);
        stats.failed++;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Token migration failed:', error);
    throw new Error('Failed to migrate tokens');
  }
}

/**
 * Check if an ad account has a valid token
 */
export async function hasValidToken(adAccountId: string): Promise<boolean> {
  try {
    const adAccount = await prisma.adAccount.findUnique({
      where: { id: adAccountId },
      select: {
        facebookAccessToken: true,
        facebookTokenExpiry: true,
      },
    });
    
    if (!adAccount?.facebookAccessToken) {
      return false;
    }
    
    // Check expiry
    if (adAccount.facebookTokenExpiry && adAccount.facebookTokenExpiry < new Date()) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to check token validity:', error);
    return false;
  }
}

/**
 * Get token expiry date
 */
export async function getTokenExpiry(adAccountId: string): Promise<Date | null> {
  try {
    const adAccount = await prisma.adAccount.findUnique({
      where: { id: adAccountId },
      select: {
        facebookTokenExpiry: true,
      },
    });
    
    return adAccount?.facebookTokenExpiry || null;
  } catch (error) {
    console.error('Failed to get token expiry:', error);
    return null;
  }
}

/**
 * Get all ad accounts with tokens expiring soon (within specified days)
 */
export async function getAccountsWithExpiringTokens(
  daysUntilExpiry: number = 7
): Promise<Array<{ id: string; userId: string; expiresAt: Date }>> {
  try {
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + daysUntilExpiry);
    
    const accounts = await prisma.adAccount.findMany({
      where: {
        facebookAccessToken: {
          not: null,
        },
        facebookTokenExpiry: {
          not: null,
          lte: expiryThreshold,
          gte: new Date(), // Not already expired
        },
      },
      select: {
        id: true,
        userId: true,
        facebookTokenExpiry: true,
      },
    });
    
    return accounts.map(account => ({
      id: account.id,
      userId: account.userId,
      expiresAt: account.facebookTokenExpiry!,
    }));
  } catch (error) {
    console.error('Failed to get accounts with expiring tokens:', error);
    return [];
  }
}
