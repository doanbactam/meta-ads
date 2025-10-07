import { FacebookTokenValidation } from './facebook-api';

/**
 * Enhanced Token Validation Service
 * 
 * Provides comprehensive token validation with granular scope checking
 * and business ID validation.
 * 
 * Requirements: 8.2, 8.5 - Enhance token validation with granular scope checking
 */

// Required scopes for different operations
export const REQUIRED_SCOPES = {
  ADS_READ: ['ads_read', 'ads_management'],
  ADS_MANAGEMENT: ['ads_management'],
  BUSINESS_MANAGEMENT: ['business_management'],
  PAGES_READ: ['pages_read_engagement', 'pages_manage_ads'],
} as const;

export interface ScopeValidationResult {
  hasScope: boolean;
  missingScopes: string[];
  availableScopes: string[];
}

export interface BusinessValidationResult {
  hasAccess: boolean;
  businessId: string;
  accessType?: 'direct' | 'granular';
  availableBusinessIds: string[];
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
    isExpiringSoon: boolean; // < 7 days
    daysUntilExpiry?: number;
    shouldRefresh: boolean;
  };
}

/**
 * Check if token has required scopes
 */
export function validateScopes(
  tokenScopes: string[] = [],
  requiredScopes: readonly string[]
): ScopeValidationResult {
  const hasScope = requiredScopes.some(required => 
    tokenScopes.includes(required)
  );
  
  const missingScopes = hasScope 
    ? [] 
    : requiredScopes.filter(required => !tokenScopes.includes(required));
  
  return {
    hasScope,
    missingScopes,
    availableScopes: tokenScopes,
  };
}

/**
 * Check if token has access to specific business
 */
export function validateBusinessAccess(
  businessId: string,
  tokenValidation: FacebookTokenValidation
): BusinessValidationResult {
  const availableBusinessIds = tokenValidation.businessIds || [];
  
  // Check direct business ID match
  const hasDirectAccess = availableBusinessIds.includes(businessId);
  
  // Check granular scopes for business access
  let hasGranularAccess = false;
  if (tokenValidation.granularScopes) {
    hasGranularAccess = tokenValidation.granularScopes.some(gs => {
      const isBusinessScope = ['ads_management', 'business_management', 'ads_read'].includes(gs.scope);
      const hasBusinessId = gs.target_ids?.includes(businessId);
      return isBusinessScope && hasBusinessId;
    });
  }
  
  const hasAccess = hasDirectAccess || hasGranularAccess;
  const accessType = hasDirectAccess ? 'direct' : hasGranularAccess ? 'granular' : undefined;
  
  return {
    hasAccess,
    businessId,
    accessType,
    availableBusinessIds,
  };
}

/**
 * Check token expiry and determine if refresh is needed
 */
export function checkTokenHealth(expiresAt?: number): {
  isExpiringSoon: boolean;
  daysUntilExpiry?: number;
  shouldRefresh: boolean;
  isExpired: boolean;
} {
  if (!expiresAt) {
    // No expiry means long-lived token or no expiry info
    return {
      isExpiringSoon: false,
      shouldRefresh: false,
      isExpired: false,
    };
  }
  
  const now = Date.now() / 1000; // Convert to seconds
  const secondsUntilExpiry = expiresAt - now;
  const daysUntilExpiry = Math.floor(secondsUntilExpiry / 86400);
  
  const isExpired = secondsUntilExpiry <= 0;
  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const shouldRefresh = isExpiringSoon || isExpired;
  
  return {
    isExpiringSoon,
    daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,
    shouldRefresh,
    isExpired,
  };
}

/**
 * Enhanced token validation with comprehensive checks
 */
export function enhanceTokenValidation(
  validation: FacebookTokenValidation
): EnhancedTokenValidation {
  const scopes = validation.scopes || [];
  
  // Validate scopes for different operations
  const canReadAds = validateScopes(scopes, REQUIRED_SCOPES.ADS_READ).hasScope;
  const canManageAds = validateScopes(scopes, REQUIRED_SCOPES.ADS_MANAGEMENT).hasScope;
  const canManageBusiness = validateScopes(scopes, REQUIRED_SCOPES.BUSINESS_MANAGEMENT).hasScope;
  const canAccessPages = validateScopes(scopes, REQUIRED_SCOPES.PAGES_READ).hasScope;
  
  // Check token health
  const tokenHealth = checkTokenHealth(validation.expiresAt);
  
  // Business validation
  const hasBusinessAccess = (validation.businessIds?.length || 0) > 0;
  const accessibleBusinessIds = validation.businessIds || [];
  
  return {
    ...validation,
    scopeValidation: {
      canReadAds,
      canManageAds,
      canManageBusiness,
      canAccessPages,
    },
    businessValidation: {
      hasBusinessAccess,
      accessibleBusinessIds,
    },
    tokenHealth: {
      isExpiringSoon: tokenHealth.isExpiringSoon,
      daysUntilExpiry: tokenHealth.daysUntilExpiry,
      shouldRefresh: tokenHealth.shouldRefresh,
    },
  };
}

/**
 * Validate if token can perform specific operation on business
 */
export function canPerformOperation(
  validation: EnhancedTokenValidation,
  operation: 'read' | 'manage',
  businessId?: string
): {
  allowed: boolean;
  reason?: string;
} {
  // Check if token is valid
  if (!validation.isValid) {
    return {
      allowed: false,
      reason: validation.error || 'Token is not valid',
    };
  }
  
  // Check if token is expired
  if (validation.tokenHealth?.isExpiringSoon) {
    console.warn('Token is expiring soon and should be refreshed');
  }
  
  // Check scopes
  const hasRequiredScope = operation === 'read' 
    ? validation.scopeValidation?.canReadAds
    : validation.scopeValidation?.canManageAds;
  
  if (!hasRequiredScope) {
    return {
      allowed: false,
      reason: `Missing required scope for ${operation} operation`,
    };
  }
  
  // Check business access if businessId provided
  if (businessId) {
    const businessValidation = validateBusinessAccess(businessId, validation);
    
    if (!businessValidation.hasAccess) {
      return {
        allowed: false,
        reason: `No access to business ${businessId}. Available businesses: ${businessValidation.availableBusinessIds.join(', ') || 'none'}`,
      };
    }
  }
  
  return {
    allowed: true,
  };
}

/**
 * Get user-friendly error message for validation failure
 */
export function getValidationErrorMessage(validation: EnhancedTokenValidation): string {
  if (!validation.isValid) {
    return validation.error || 'Your Facebook token is invalid. Please reconnect your account.';
  }
  
  if (validation.tokenHealth?.shouldRefresh) {
    if (validation.tokenHealth.daysUntilExpiry === 0) {
      return 'Your Facebook token has expired. Please reconnect your account.';
    }
    return `Your Facebook token will expire in ${validation.tokenHealth.daysUntilExpiry} days. Please reconnect your account soon.`;
  }
  
  if (!validation.scopeValidation?.canReadAds) {
    return 'Your Facebook token does not have permission to read ads. Please reconnect with the required permissions.';
  }
  
  if (!validation.businessValidation?.hasBusinessAccess) {
    return 'Your Facebook token does not have access to any businesses. Please ensure you have granted business access.';
  }
  
  return 'Token validation failed. Please reconnect your Facebook account.';
}

/**
 * Format scope validation result for logging
 */
export function formatScopeValidation(result: ScopeValidationResult): string {
  if (result.hasScope) {
    return `✓ Has required scopes: ${result.availableScopes.join(', ')}`;
  }
  return `✗ Missing scopes: ${result.missingScopes.join(', ')}. Available: ${result.availableScopes.join(', ')}`;
}

/**
 * Format business validation result for logging
 */
export function formatBusinessValidation(result: BusinessValidationResult): string {
  if (result.hasAccess) {
    return `✓ Has access to business ${result.businessId} (${result.accessType})`;
  }
  return `✗ No access to business ${result.businessId}. Available: ${result.availableBusinessIds.join(', ') || 'none'}`;
}
