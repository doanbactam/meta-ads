/**
 * Facebook Token Manager
 * 
 * Unified token management system for Facebook access tokens.
 * Handles encryption, storage, validation, refresh, and revocation.
 * 
 * @module features/facebook/auth
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { FacebookMarketingAPI, FACEBOOK_ERROR_CODES } from '@/lib/integrations/facebook';
import type { FacebookTokenValidation } from '@/lib/integrations/facebook';

const prisma = new PrismaClient();

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
}

export interface TokenRefreshResult {
  accountId: string;
  success: boolean;
  error?: string;
  newExpiresAt?: Date;
}

export interface TokenRevocationInfo {
  isRevoked: boolean;
  reason?: string;
  errorCode?: number;
  shouldReauthenticate: boolean;
}

export interface EnhancedTokenValidation extends FacebookTokenValidation {
  scopeValidation?: {
    canReadAds: boolean;
    canManageAds: boolean;
    canManageBusiness: boolean;
    canAccessPages: boolean;
  };
  businessValidation?: {
    hasBusinessAccess: boolean;
    accessibleBusinessIds: string[];
  };
  tokenHealth?: {
    isExpiringSoon: boolean;
    daysUntilExpiry?: number;
    shouldRefresh: boolean;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ENCRYPTION = {
  ALGORITHM: 'aes-256-gcm' as const,
  IV_LENGTH: 16,
  SALT_LENGTH: 64,
  TAG_LENGTH: 16,
  KEY_LENGTH: 32,
  ITERATIONS: 100000,
};

export const REQUIRED_SCOPES = {
  ADS_READ: ['ads_read', 'ads_management'],
  ADS_MANAGEMENT: ['ads_management'],
  BUSINESS_MANAGEMENT: ['business_management'],
  PAGES_READ: ['pages_read_engagement', 'pages_manage_ads'],
} as const;

const TOKEN_REVOCATION_ERROR_CODES = [
  FACEBOOK_ERROR_CODES.INVALID_TOKEN,
  FACEBOOK_ERROR_CODES.PERMISSION_DENIED,
  463, // Session invalidated
  467, // Session expired
];

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

// ============================================================================
// TOKEN MANAGER CLASS
// ============================================================================

export class TokenManager {
  private static instance: TokenManager;
  
  private constructor() {}
  
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }
  
  // ==========================================================================
  // ENCRYPTION
  // ==========================================================================
  
  private getEncryptionKey(): string {
    const key = process.env.TOKEN_ENCRYPTION_KEY;
    
    if (!key) {
      console.warn(
        'TOKEN_ENCRYPTION_KEY not set. Using fallback key. ' +
        'This is NOT secure for production.'
      );
      return process.env.FACEBOOK_APP_SECRET || 'insecure-fallback-key';
    }
    
    return key;
  }
  
  private deriveKey(masterKey: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      masterKey,
      salt,
      ENCRYPTION.ITERATIONS,
      ENCRYPTION.KEY_LENGTH,
      'sha256'
    );
  }
  
  encrypt(token: string): EncryptedData {
    if (!token) throw new Error('Token cannot be empty');
    
    try {
      const salt = crypto.randomBytes(ENCRYPTION.SALT_LENGTH);
      const key = this.deriveKey(this.getEncryptionKey(), salt);
      const iv = crypto.randomBytes(ENCRYPTION.IV_LENGTH);
      const cipher = crypto.createCipheriv(ENCRYPTION.ALGORITHM, key, iv);
      
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: cipher.getAuthTag().toString('hex'),
        salt: salt.toString('hex'),
      };
    } catch (error) {
      console.error('Token encryption failed:', error);
      throw new Error('Failed to encrypt token');
    }
  }
  
  decrypt(encryptedData: EncryptedData): string {
    if (!encryptedData?.encrypted || !encryptedData.iv || !encryptedData.tag || !encryptedData.salt) {
      throw new Error('Invalid encrypted data format');
    }
    
    try {
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const key = this.deriveKey(this.getEncryptionKey(), salt);
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      const decipher = crypto.createDecipheriv(ENCRYPTION.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Token decryption failed:', error);
      throw new Error('Failed to decrypt token');
    }
  }
  
  serialize(encryptedData: EncryptedData): string {
    return `${encryptedData.encrypted}:${encryptedData.iv}:${encryptedData.tag}:${encryptedData.salt}`;
  }
  
  deserialize(serialized: string): EncryptedData {
    const parts = serialized.split(':');
    if (parts.length !== 4) throw new Error('Invalid serialized token format');
    
    return {
      encrypted: parts[0],
      iv: parts[1],
      tag: parts[2],
      salt: parts[3],
    };
  }
  
  isEncrypted(token: string): boolean {
    const parts = token.split(':');
    return parts.length === 4 && parts.every(part => /^[0-9a-f]+$/i.test(part));
  }
  
  // ==========================================================================
  // STORAGE
  // ==========================================================================
  
  async save(accountId: string, token: string, expiresAt?: Date): Promise<void> {
    try {
      const encrypted = this.encrypt(token);
      const serialized = this.serialize(encrypted);
      
      await prisma.adAccount.update({
        where: { id: accountId },
        data: {
          facebookAccessToken: serialized,
          facebookTokenExpiry: expiresAt,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to save token:', error);
      throw new Error('Failed to save token to database');
    }
  }
  
  async get(accountId: string): Promise<string | null> {
    try {
      const account = await prisma.adAccount.findUnique({
        where: { id: accountId },
        select: {
          facebookAccessToken: true,
          facebookTokenExpiry: true,
        },
      });
      
      if (!account?.facebookAccessToken) return null;
      
      // Check expiry
      if (account.facebookTokenExpiry && account.facebookTokenExpiry < new Date()) {
        console.warn(`Token for account ${accountId} has expired`);
        return null;
      }
      
      // Decrypt
      if (this.isEncrypted(account.facebookAccessToken)) {
        const encrypted = this.deserialize(account.facebookAccessToken);
        return this.decrypt(encrypted);
      }
      
      // Return plain token (backward compatibility)
      return account.facebookAccessToken;
    } catch (error) {
      console.error('Failed to get token:', error);
      throw new Error('Failed to retrieve token from database');
    }
  }
  
  async delete(accountId: string): Promise<void> {
    try {
      await prisma.adAccount.update({
        where: { id: accountId },
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
  
  async hasValid(accountId: string): Promise<boolean> {
    try {
      const account = await prisma.adAccount.findUnique({
        where: { id: accountId },
        select: {
          facebookAccessToken: true,
          facebookTokenExpiry: true,
        },
      });
      
      if (!account?.facebookAccessToken) return false;
      
      if (account.facebookTokenExpiry && account.facebookTokenExpiry < new Date()) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to check token validity:', error);
      return false;
    }
  }
  
  // ==========================================================================
  // VALIDATION
  // ==========================================================================
  
  validateScopes(tokenScopes: string[] = [], requiredScopes: readonly string[]) {
    const hasScope = requiredScopes.some(required => tokenScopes.includes(required));
    const missingScopes = hasScope ? [] : requiredScopes.filter(r => !tokenScopes.includes(r));
    
    return {
      hasScope,
      missingScopes,
      availableScopes: tokenScopes,
    };
  }
  
  checkHealth(expiresAt?: number) {
    if (!expiresAt) {
      return {
        isExpiringSoon: false,
        shouldRefresh: false,
        isExpired: false,
      };
    }
    
    const now = Date.now() / 1000;
    const secondsUntilExpiry = expiresAt - now;
    const daysUntilExpiry = Math.floor(secondsUntilExpiry / 86400);
    
    const isExpired = secondsUntilExpiry <= 0;
    const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    
    return {
      isExpiringSoon,
      daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,
      shouldRefresh: isExpiringSoon || isExpired,
      isExpired,
    };
  }
  
  enhance(validation: FacebookTokenValidation): EnhancedTokenValidation {
    const scopes = validation.scopes || [];
    
    return {
      ...validation,
      scopeValidation: {
        canReadAds: this.validateScopes(scopes, REQUIRED_SCOPES.ADS_READ).hasScope,
        canManageAds: this.validateScopes(scopes, REQUIRED_SCOPES.ADS_MANAGEMENT).hasScope,
        canManageBusiness: this.validateScopes(scopes, REQUIRED_SCOPES.BUSINESS_MANAGEMENT).hasScope,
        canAccessPages: this.validateScopes(scopes, REQUIRED_SCOPES.PAGES_READ).hasScope,
      },
      businessValidation: {
        hasBusinessAccess: (validation.businessIds?.length || 0) > 0,
        accessibleBusinessIds: validation.businessIds || [],
      },
      tokenHealth: this.checkHealth(validation.expiresAt),
    };
  }
  
  // ==========================================================================
  // REFRESH
  // ==========================================================================
  
  private async exchangeForLongLived(shortLivedToken: string) {
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
      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in || 5184000, // 60 days
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      return null;
    }
  }
  
  async refresh(accountId: string): Promise<TokenRefreshResult> {
    try {
      const token = await this.get(accountId);
      
      if (!token) {
        return {
          accountId,
          success: false,
          error: 'No token found',
        };
      }
      
      // Validate current token
      const api = new FacebookMarketingAPI(token);
      const validation = await api.validateToken();
      
      if (!validation.isValid) {
        return {
          accountId,
          success: false,
          error: 'Current token is invalid',
        };
      }
      
      // Exchange for long-lived token
      const result = await this.exchangeForLongLived(token);
      
      if (!result) {
        return {
          accountId,
          success: false,
          error: 'Token exchange failed',
        };
      }
      
      const newExpiresAt = new Date(Date.now() + result.expiresIn * 1000);
      await this.save(accountId, result.accessToken, newExpiresAt);
      
      console.log(`✓ Token refreshed for ${accountId}, expires ${newExpiresAt.toISOString()}`);
      
      return {
        accountId,
        success: true,
        newExpiresAt,
      };
    } catch (error) {
      console.error(`Failed to refresh token for ${accountId}:`, error);
      return {
        accountId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  async getExpiringAccounts(daysUntilExpiry: number = 7) {
    try {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + daysUntilExpiry);
      
      const accounts = await prisma.adAccount.findMany({
        where: {
          facebookAccessToken: { not: null },
          facebookTokenExpiry: {
            not: null,
            lte: threshold,
            gte: new Date(),
          },
        },
        select: {
          id: true,
          userId: true,
          facebookTokenExpiry: true,
        },
      });
      
      return accounts.map(a => ({
        id: a.id,
        userId: a.userId,
        expiresAt: a.facebookTokenExpiry!,
      }));
    } catch (error) {
      console.error('Failed to get expiring accounts:', error);
      return [];
    }
  }
  
  // ==========================================================================
  // REVOCATION
  // ==========================================================================
  
  isRevocationError(error: any): TokenRevocationInfo {
    const errorCode = error?.code || error?.error?.code;
    
    if (errorCode && TOKEN_REVOCATION_ERROR_CODES.includes(errorCode)) {
      return {
        isRevoked: true,
        reason: 'Token has been revoked or is invalid',
        errorCode,
        shouldReauthenticate: true,
      };
    }
    
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
  
  async handleRevocation(accountId: string, reason?: string): Promise<void> {
    try {
      console.log(`Handling token revocation for ${accountId}: ${reason || 'Unknown'}`);
      
      await this.delete(accountId);
      
      await prisma.adAccount.update({
        where: { id: accountId },
        data: {
          status: 'DISABLED',
          syncStatus: 'ERROR',
          syncError: reason || 'Token revoked. Please reconnect your Facebook account.',
          lastSyncedAt: new Date(),
        },
      });
      
      console.log(`✓ Token revocation handled for ${accountId}`);
    } catch (error) {
      console.error(`Failed to handle revocation for ${accountId}:`, error);
      throw error;
    }
  }
  
  async handleRevocationFromError(accountId: string, error: any): Promise<boolean> {
    const info = this.isRevocationError(error);
    
    if (info.isRevoked) {
      await this.handleRevocation(accountId, info.reason);
      return true;
    }
    
    return false;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const tokenManager = TokenManager.getInstance();
