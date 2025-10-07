/**
 * Facebook Authentication Module
 * 
 * Centralized token management for Facebook integration.
 * 
 * @module features/facebook/auth
 */

export { tokenManager, TokenManager } from './token-manager';
export type {
  EncryptedData,
  TokenRefreshResult,
  TokenRevocationInfo,
  EnhancedTokenValidation,
} from './token-manager';
export { REQUIRED_SCOPES } from './token-manager';
