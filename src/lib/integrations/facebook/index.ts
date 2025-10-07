/**
 * Facebook Integration Module
 * 
 * Centralized Facebook Marketing API integration.
 * 
 * @module lib/integrations/facebook
 */

// Configuration
export { FACEBOOK_API_CONFIG, FACEBOOK_FIELDS, getFieldsString, getApiUrl, isFeatureEnabled } from './config';

// Error handling
export {
  FacebookErrorType,
  FacebookAPIError,
  FacebookErrorHandler,
  createFacebookError,
  isFacebookError,
  withFacebookErrorHandling,
  ERROR_CODE_MAP,
} from './errors';
export type { FacebookErrorContext, RetryOptions } from './errors';

// API Client
export { FacebookMarketingAPI, FACEBOOK_ERROR_CODES } from './api-client';
export type { FacebookTokenValidation } from './api-client';
