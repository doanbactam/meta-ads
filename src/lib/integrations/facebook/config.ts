/**
 * Facebook Integration Configuration
 * 
 * Centralized configuration for Facebook Marketing API integration.
 * Validates environment variables and provides typed config.
 * 
 * @module lib/integrations/facebook
 */

import { z } from 'zod';

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

const FacebookEnvSchema = z.object({
  FACEBOOK_APP_ID: z.string().min(1, 'FACEBOOK_APP_ID is required'),
  FACEBOOK_APP_SECRET: z.string().min(1, 'FACEBOOK_APP_SECRET is required'),
  FACEBOOK_API_VERSION: z.string().default('v23.0'),
  FACEBOOK_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  FACEBOOK_WEBHOOK_SECRET: z.string().optional(),
  CACHE_PROVIDER: z.enum(['memory', 'redis']).default('memory'),
  REDIS_URL: z.string().optional(),
  RATE_LIMIT_APP_CALLS_PER_HOUR: z.string().default('200'),
  RATE_LIMIT_USER_CALLS_PER_HOUR: z.string().default('200'),
  ENABLE_BATCH_REQUESTS: z.string().default('true'),
  ENABLE_WEBHOOKS: z.string().default('true'),
  ENABLE_FIELD_EXPANSION: z.string().default('true'),
  USE_NEW_SDK_CLIENT: z.string().default('true'),
});

type FacebookEnv = z.infer<typeof FacebookEnvSchema>;

function validateEnv(): FacebookEnv {
  try {
    return FacebookEnvSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid Facebook configuration:', error);
    throw new Error('Facebook environment variables validation failed');
  }
}

const env = validateEnv();

// ============================================================================
// FIELD SETS
// ============================================================================

export const FACEBOOK_FIELDS = {
  adAccount: [
    'id',
    'name',
    'account_status',
    'currency',
    'timezone_name',
    'business',
    'capabilities',
    'funding_source',
    'spend_cap',
    'amount_spent',
  ],

  campaign: [
    'id',
    'name',
    'status',
    'effective_status',
    'objective',
    'spend_cap',
    'daily_budget',
    'lifetime_budget',
    'budget_remaining',
    'created_time',
    'updated_time',
    'start_time',
    'stop_time',
    'special_ad_categories',
    'bid_strategy',
  ],

  adSet: [
    'id',
    'name',
    'status',
    'effective_status',
    'campaign_id',
    'daily_budget',
    'lifetime_budget',
    'budget_remaining',
    'bid_amount',
    'billing_event',
    'optimization_goal',
    'targeting',
    'start_time',
    'end_time',
    'created_time',
    'updated_time',
  ],

  ad: [
    'id',
    'name',
    'status',
    'effective_status',
    'adset_id',
    'campaign_id',
    'creative',
    'tracking_specs',
    'conversion_specs',
    'created_time',
    'updated_time',
  ],

  insights: [
    'impressions',
    'clicks',
    'spend',
    'reach',
    'frequency',
    'ctr',
    'cpc',
    'cpm',
    'cpp',
    'actions',
    'action_values',
    'conversions',
    'cost_per_action_type',
    'cost_per_conversion',
  ],
} as const;

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const FACEBOOK_API_CONFIG = {
  appId: env.FACEBOOK_APP_ID,
  appSecret: env.FACEBOOK_APP_SECRET,
  apiVersion: env.FACEBOOK_API_VERSION,
  webhookVerifyToken: env.FACEBOOK_WEBHOOK_VERIFY_TOKEN,
  webhookSecret: env.FACEBOOK_WEBHOOK_SECRET,
  
  // Rate limits
  rateLimits: {
    appCallsPerHour: Number.parseInt(env.RATE_LIMIT_APP_CALLS_PER_HOUR),
    userCallsPerHour: Number.parseInt(env.RATE_LIMIT_USER_CALLS_PER_HOUR),
  },
  
  // Feature flags
  features: {
    batchRequests: env.ENABLE_BATCH_REQUESTS === 'true',
    webhooks: env.ENABLE_WEBHOOKS === 'true',
    fieldExpansion: env.ENABLE_FIELD_EXPANSION === 'true',
    useNewSDKClient: env.USE_NEW_SDK_CLIENT === 'true',
  },
  
  // Cache configuration
  cache: {
    provider: env.CACHE_PROVIDER,
    redisUrl: env.REDIS_URL,
    ttl: {
      insights: 10 * 60 * 1000, // 10 minutes
      campaigns: 3 * 60 * 1000, // 3 minutes
      adSets: 3 * 60 * 1000, // 3 minutes
      ads: 3 * 60 * 1000, // 3 minutes
      accounts: 30 * 60 * 1000, // 30 minutes
    },
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getFieldsString(entity: keyof typeof FACEBOOK_FIELDS): string {
  return FACEBOOK_FIELDS[entity].join(',');
}

export function getApiUrl(path: string): string {
  return `https://graph.facebook.com/${FACEBOOK_API_CONFIG.apiVersion}${path}`;
}

export function isFeatureEnabled(feature: keyof typeof FACEBOOK_API_CONFIG.features): boolean {
  return FACEBOOK_API_CONFIG.features[feature];
}
