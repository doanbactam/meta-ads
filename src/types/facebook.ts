/**
 * Facebook API Type Definitions
 * 
 * Consolidated types for Facebook integration.
 */

export interface FacebookTokenValidation {
  isValid: boolean;
  error?: string;
  scopes?: string[];
  businessIds?: string[];
  expiresAt?: number;
  granularScopes?: Array<{
    scope: string;
    target_ids?: string[];
  }>;
}

export interface FacebookAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
}

export interface FacebookCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
}
