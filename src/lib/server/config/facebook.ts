import { z } from "zod";

// ============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================================================

const FacebookEnvSchema = z.object({
  FACEBOOK_APP_ID: z.string().min(1, "FACEBOOK_APP_ID is required"),
  FACEBOOK_APP_SECRET: z.string().min(1, "FACEBOOK_APP_SECRET is required"),
  FACEBOOK_API_VERSION: z.string().default("v23.0"),
  FACEBOOK_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  FACEBOOK_WEBHOOK_SECRET: z.string().optional(),
  CACHE_PROVIDER: z.enum(["memory", "redis"]).default("memory"),
  REDIS_URL: z.string().optional(),
  RATE_LIMIT_APP_CALLS_PER_HOUR: z.string().default("200"),
  RATE_LIMIT_USER_CALLS_PER_HOUR: z.string().default("200"),
  ENABLE_BATCH_REQUESTS: z.string().default("true"),
  ENABLE_WEBHOOKS: z.string().default("true"),
  ENABLE_FIELD_EXPANSION: z.string().default("true"),
  USE_NEW_SDK_CLIENT: z.string().default("true"),
});

/**
 * Validate và parse environment variables
 * 
 * Sử dụng Zod schema để validate required environment variables.
 * Throws error nếu validation fails.
 * 
 * @private
 * @returns {z.infer<typeof FacebookEnvSchema>} Validated environment variables
 * @throws {Error} Nếu required variables missing hoặc invalid
 */
function validateEnv() {
  try {
    return FacebookEnvSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Invalid Facebook configuration:", error);
    throw new Error("Facebook environment variables validation failed");
  }
}

const env = validateEnv();

// ============================================================================
// FIELD SETS
// ============================================================================

/**
 * Field sets for different Facebook API entities
 * These define which fields to request from the API
 */
export const FACEBOOK_FIELDS = {
  adAccount: [
    "id",
    "name",
    "account_status",
    "currency",
    "timezone_name",
    "business",
    "capabilities",
    "funding_source",
    "spend_cap",
    "amount_spent",
  ],

  campaign: [
    "id",
    "name",
    "status",
    "effective_status",
    "objective",
    "spend_cap",
    "daily_budget",
    "lifetime_budget",
    "budget_remaining",
    "created_time",
    "updated_time",
    "start_time",
    "stop_time",
    "special_ad_categories",
    "bid_strategy",
  ],

  adSet: [
    "id",
    "name",
    "status",
    "effective_status",
    "campaign_id",
    "daily_budget",
    "lifetime_budget",
    "budget_remaining",
    "bid_amount",
    "billing_event",
    "optimization_goal",
    "targeting",
    "start_time",
    "end_time",
    "created_time",
    "updated_time",
  ],

  ad: [
    "id",
    "name",
    "status",
    "effective_status",
    "adset_id",
    "campaign_id",
    "creative",
    "tracking_specs",
    "conversion_specs",
    "created_time",
    "updated_time",
  ],

  insights: [
    "impressions",
    "reach",
    "frequency",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "cpp",
    "spend",
    "actions",
    "action_values",
    "cost_per_action_type",
    "video_avg_time_watched_actions",
    "video_p25_watched_actions",
    "video_p50_watched_actions",
    "video_p75_watched_actions",
    "video_p100_watched_actions",
    "date_start",
    "date_stop",
  ],
} as const;

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

/**
 * Cache TTL (Time To Live) in milliseconds for different entity types
 */
export const CACHE_TTL = {
  adAccount: 30 * 60 * 1000, // 30 minutes
  campaign: 5 * 60 * 1000, // 5 minutes
  adSet: 5 * 60 * 1000, // 5 minutes
  ad: 5 * 60 * 1000, // 5 minutes
  insights: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  provider: env.CACHE_PROVIDER,
  redisUrl: env.REDIS_URL,
  ttl: CACHE_TTL,
  maxSize: 1000, // Maximum number of cache entries
  evictionPolicy: "LRU" as const, // Least Recently Used
} as const;

// ============================================================================
// RATE LIMIT CONFIGURATION
// ============================================================================

/**
 * Rate limit configuration based on Facebook's guidelines
 */
export const RATE_LIMIT_CONFIG = {
  appCallsPerHour: parseInt(env.RATE_LIMIT_APP_CALLS_PER_HOUR),
  userCallsPerHour: parseInt(env.RATE_LIMIT_USER_CALLS_PER_HOUR),
  
  // Threshold to trigger proactive throttling (80% of limit)
  throttleThreshold: 0.8,
  
  // Window size for rate limiting (in milliseconds)
  windowSize: 60 * 60 * 1000, // 1 hour
  
  // Token bucket algorithm settings
  tokenBucket: {
    capacity: parseInt(env.RATE_LIMIT_APP_CALLS_PER_HOUR),
    refillRate: parseInt(env.RATE_LIMIT_APP_CALLS_PER_HOUR) / 3600, // tokens per second
  },
} as const;

// ============================================================================
// BATCH REQUEST CONFIGURATION
// ============================================================================

/**
 * Batch request configuration
 */
export const BATCH_CONFIG = {
  enabled: env.ENABLE_BATCH_REQUESTS === "true",
  
  // Maximum requests per batch (Facebook limit is 50)
  maxBatchSize: 50,
  
  // Auto-execute batch when queue reaches this size
  autoExecuteThreshold: 25,
  
  // Maximum time to wait before auto-executing batch (in milliseconds)
  autoExecuteTimeout: 100,
  
  // Maximum concurrent batches
  maxConcurrentBatches: 3,
} as const;

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

/**
 * Retry configuration for failed requests
 */
export const RETRY_CONFIG = {
  // Maximum number of retry attempts
  maxRetries: 3,
  
  // Base delay for exponential backoff (in milliseconds)
  baseDelay: 1000,
  
  // Maximum delay between retries (in milliseconds)
  maxDelay: 60000, // 60 seconds
  
  // Jitter range for randomization (in milliseconds)
  jitterRange: 500,
  
  // Retry only on specific error types
  retryableErrorTypes: ["RATE_LIMIT", "TEMPORARY", "NETWORK"],
} as const;

// ============================================================================
// WEBHOOK CONFIGURATION
// ============================================================================

/**
 * Webhook configuration
 */
export const WEBHOOK_CONFIG = {
  enabled: env.ENABLE_WEBHOOKS === "true",
  verifyToken: env.FACEBOOK_WEBHOOK_VERIFY_TOKEN,
  secret: env.FACEBOOK_WEBHOOK_SECRET,
  
  // Webhook subscription fields
  subscriptionFields: [
    "ads_insights",
    "campaign_status",
    "adset_status",
    "ad_status",
  ],
  
  // Retry configuration for webhook processing
  retry: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
  },
} as const;

// ============================================================================
// API CONFIGURATION
// ============================================================================

/**
 * Facebook API configuration
 */
export const FACEBOOK_API_CONFIG = {
  appId: env.FACEBOOK_APP_ID,
  appSecret: env.FACEBOOK_APP_SECRET,
  apiVersion: env.FACEBOOK_API_VERSION,
  
  // Base URL for Facebook Graph API
  baseUrl: `https://graph.facebook.com/${env.FACEBOOK_API_VERSION}`,
  
  // Feature flags
  features: {
    batchRequests: env.ENABLE_BATCH_REQUESTS === "true",
    webhooks: env.ENABLE_WEBHOOKS === "true",
    fieldExpansion: env.ENABLE_FIELD_EXPANSION === "true",
    useNewSdkClient: env.USE_NEW_SDK_CLIENT === "true",
  },
  
  // Field sets
  fields: FACEBOOK_FIELDS,
  
  // Cache configuration
  cache: CACHE_CONFIG,
  
  // Rate limit configuration
  rateLimit: RATE_LIMIT_CONFIG,
  
  // Batch configuration
  batch: BATCH_CONFIG,
  
  // Retry configuration
  retry: RETRY_CONFIG,
  
  // Webhook configuration
  webhook: WEBHOOK_CONFIG,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get field list as comma-separated string cho API requests
 * 
 * Convert predefined field array thành comma-separated string
 * để sử dụng trong Facebook API query parameters.
 * 
 * @param {keyof typeof FACEBOOK_FIELDS} entityType - Entity type ('adAccount', 'campaign', 'adSet', 'ad', 'insights')
 * @returns {string} Comma-separated field list
 * 
 * @example
 * ```typescript
 * const fields = getFieldsString('campaign');
 * // Returns: 'id,name,status,effective_status,objective,...'
 * 
 * const url = `https://graph.facebook.com/v23.0/act_123/campaigns?fields=${fields}`;
 * ```
 */
export function getFieldsString(entityType: keyof typeof FACEBOOK_FIELDS): string {
  return FACEBOOK_FIELDS[entityType].join(",");
}

/**
 * Get cache TTL cho entity type
 * 
 * Returns TTL in milliseconds cho specific entity type.
 * 
 * @param {keyof typeof CACHE_TTL} entityType - Entity type
 * @returns {number} TTL in milliseconds
 * 
 * @example
 * ```typescript
 * const ttl = getCacheTTL('campaign');
 * // Returns: 300000 (5 minutes)
 * 
 * cache.set(key, value, ttl);
 * ```
 */
export function getCacheTTL(entityType: keyof typeof CACHE_TTL): number {
  return CACHE_TTL[entityType];
}

/**
 * Check nếu feature flag enabled
 * 
 * Kiểm tra feature flags từ environment variables.
 * 
 * @param {keyof typeof FACEBOOK_API_CONFIG.features} feature - Feature name
 * @returns {boolean} True nếu feature enabled
 * 
 * @example
 * ```typescript
 * if (isFeatureEnabled('batchRequests')) {
 *   // Use batch request manager
 *   const batchManager = new BatchRequestManager(client);
 * }
 * 
 * if (isFeatureEnabled('webhooks')) {
 *   // Setup webhook handlers
 *   setupWebhooks();
 * }
 * ```
 */
export function isFeatureEnabled(feature: keyof typeof FACEBOOK_API_CONFIG.features): boolean {
  return FACEBOOK_API_CONFIG.features[feature];
}

/**
 * Get full API endpoint URL
 * 
 * Construct full URL từ base URL và relative path.
 * Tự động handle leading slash.
 * 
 * @param {string} path - Relative path (e.g., 'act_123/campaigns' hoặc '/act_123/campaigns')
 * @returns {string} Full API endpoint URL
 * 
 * @example
 * ```typescript
 * const url = getApiEndpoint('act_123/campaigns');
 * // Returns: 'https://graph.facebook.com/v23.0/act_123/campaigns'
 * 
 * const url = getApiEndpoint('/me/adaccounts');
 * // Returns: 'https://graph.facebook.com/v23.0/me/adaccounts'
 * ```
 */
export function getApiEndpoint(path: string): string {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${FACEBOOK_API_CONFIG.baseUrl}/${cleanPath}`;
}

/**
 * Validate Facebook access token format
 * 
 * Performs basic format validation (không check với Facebook API).
 * Facebook tokens thường là alphanumeric với minimum length 50.
 * 
 * @param {string} token - Access token to validate
 * @returns {boolean} True nếu format valid
 * 
 * @example
 * ```typescript
 * const token = 'EAABwzLixnjYBO...';
 * 
 * if (isValidAccessToken(token)) {
 *   const client = new FacebookSDKClient({ accessToken: token });
 * } else {
 *   throw new Error('Invalid token format');
 * }
 * ```
 * 
 * @note Chỉ validate format, không check expiry hoặc permissions.
 *       Sử dụng validateToken() method để check với Facebook API.
 */
export function isValidAccessToken(token: string): boolean {
  // Facebook access tokens are typically alphanumeric with some special characters
  // and have a minimum length
  return token.length >= 50 && /^[A-Za-z0-9_-]+$/.test(token);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FACEBOOK_API_CONFIG;
