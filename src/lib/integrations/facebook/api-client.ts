/**
 * Facebook API Client
 * 
 * High-level wrapper around Facebook Marketing API.
 * Provides simplified interface for common operations.
 * 
 * @module lib/integrations/facebook
 */

import { FACEBOOK_API_CONFIG } from './config';
import { FacebookErrorHandler, createFacebookError } from './errors';

export const FACEBOOK_ERROR_CODES = {
  INVALID_TOKEN: 190,
  PERMISSION_DENIED: 200,
  RATE_LIMIT: 17,
  API_TOO_MANY_CALLS: 4,
  TEMPORARILY_BLOCKED: 368,
  TEMPORARY_ISSUE: 2,
  RATE_LIMIT_REACHED: 613,
  ACCOUNT_DELETED: 100,
} as const;

export interface FacebookTokenValidation {
  isValid: boolean;
  appId?: string;
  userId?: string;
  expiresAt?: number;
  scopes?: string[];
  businessIds?: string[];
  granularScopes?: Array<{
    scope: string;
    target_ids?: string[];
  }>;
  error?: string;
}

export class FacebookMarketingAPI {
  private errorHandler: FacebookErrorHandler;
  
  constructor(private accessToken: string) {
    this.errorHandler = new FacebookErrorHandler();
  }
  
  async validateToken(): Promise<FacebookTokenValidation> {
    try {
      const url = `https://graph.facebook.com/${FACEBOOK_API_CONFIG.apiVersion}/debug_token`;
      const params = new URLSearchParams({
        input_token: this.accessToken,
        access_token: `${FACEBOOK_API_CONFIG.appId}|${FACEBOOK_API_CONFIG.appSecret}`,
      });
      
      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw createFacebookError(error);
      }
      
      const data = await response.json();
      const tokenData = data.data;
      
      if (!tokenData.is_valid) {
        return {
          isValid: false,
          error: tokenData.error?.message || 'Token is invalid',
        };
      }
      
      return {
        isValid: true,
        appId: tokenData.app_id,
        userId: tokenData.user_id,
        expiresAt: tokenData.expires_at,
        scopes: tokenData.scopes || [],
        granularScopes: tokenData.granular_scopes || [],
      };
    } catch (error) {
      console.error('Token validation failed:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }
}
