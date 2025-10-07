import {
  facebookCampaignDataSchema,
  facebookCampaignInsightsSchema,
  facebookAdSetDataSchema,
  facebookAdDataSchema,
  facebookAdAccountDataSchema,
} from './validations/schemas';
import { mapFacebookStatus } from './formatters';

/**
 * Safe number parsing utilities with proper validation
 */

/**
 * Safely parse a float value from Facebook API
 * Facebook API returns monetary values in cents (e.g., "10000" = $100.00)
 * @param value - The value to parse (string or number)
 * @param divideBy - Divisor for currency conversion (default: 100 for cents to dollars)
 * @returns Parsed and validated float number
 */
export function safeParseFloat(
  value: string | number | null | undefined,
  divideBy: number = 1
): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }

  const result = num / divideBy;
  return isFinite(result) ? result : 0;
}

/**
 * Safely parse an integer value from Facebook API
 * @param value - The value to parse (string or number)
 * @returns Parsed and validated integer
 */
export function safeParseInt(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const num = typeof value === 'string' ? parseInt(value, 10) : Math.floor(value);

  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }

  return num;
}

/**
 * Safely parse a percentage value from Facebook API
 * Facebook returns percentages as strings (e.g., "5.23")
 * @param value - The value to parse
 * @returns Parsed percentage as float
 */
export function safeParsePercentage(value: string | number | null | undefined): number {
  const num = safeParseFloat(value, 1);
  // Ensure percentage is within valid range
  return Math.max(0, Math.min(100, num));
}

/**
 * Sanitize Facebook campaign data with validation
 */
export function sanitizeFacebookCampaign(data: any) {
  try {
    const validated = facebookCampaignDataSchema.parse(data);
    return {
      id: validated.id,
      name: validated.name,
      status: validated.status,
      objective: validated.objective ?? undefined,
      spendCap: validated.spendCap ?? undefined,
      dailyBudget: validated.dailyBudget ?? undefined,
      lifetimeBudget: validated.lifetimeBudget ?? undefined,
    };
  } catch (error) {
    console.warn(`Failed to validate campaign data for ${data?.id}:`, error);
    // Return safe defaults if validation fails
    return {
      id: data?.id || 'unknown',
      name: data?.name || 'Unnamed Campaign',
      status: 'PAUSED',
      objective: undefined,
      spendCap: undefined,
      dailyBudget: undefined,
      lifetimeBudget: undefined,
    };
  }
}

/**
 * Sanitize Facebook insights data with safe number parsing
 * This function is designed to be resilient. If Zod validation fails,
 * it logs a warning but still attempts to parse the raw data field by field.
 */
export function sanitizeFacebookInsights(data: any) {
  // Use zod's .safeParse to avoid throwing an error on validation failure
  const validation = facebookCampaignInsightsSchema.safeParse(data);
  let sourceData: any;

  if (validation.success) {
    // If validation succeeds, use the validated (and typed) data
    sourceData = validation.data;
  } else {
    // If validation fails, log the issues but proceed with the original raw data.
    // This makes the sanitization resilient to unexpected API changes.
    console.warn(
      'Failed to validate insights data, proceeding with raw data:',
      validation.error.flatten()
    );
    sourceData = data || {}; // Use raw data, ensuring it's not null/undefined
  }

  // Sanitize each field individually from the source data.
  // The safeParse functions will handle incorrect types, null, or undefined values
  // by returning a safe default (0), preventing a single bad field from
  // invalidating the entire dataset.
  return {
    impressions: safeParseInt(sourceData.impressions),
    clicks: safeParseInt(sourceData.clicks),
    // Facebook returns spend in cents, convert to dollars
    spend: safeParseFloat(sourceData.spend, 100),
    reach: safeParseInt(sourceData.reach),
    frequency: safeParseFloat(sourceData.frequency),
    // CTR is already a percentage
    ctr: safeParsePercentage(sourceData.ctr),
    // CPC is in cents, convert to dollars
    cpc: safeParseFloat(sourceData.cpc, 100),
    // CPM is in cents, convert to dollars
    cpm: safeParseFloat(sourceData.cpm, 100),
    conversions: safeParseInt(sourceData.conversions),
    // Cost per conversion is in cents, convert to dollars
    costPerConversion: safeParseFloat(sourceData.costPerConversion, 100),
  };
}

/**
 * Sanitize Facebook Ad Set data with validation
 */
export function sanitizeFacebookAdSet(data: any) {
  try {
    const validated = facebookAdSetDataSchema.parse(data);
    return {
      id: validated.id,
      name: validated.name,
      status: validated.status,
      effective_status: validated.effective_status ?? undefined,
      daily_budget: validated.daily_budget ?? undefined,
      lifetime_budget: validated.lifetime_budget ?? undefined,
      bid_amount: validated.bid_amount ?? undefined,
      targeting: validated.targeting ?? undefined,
    };
  } catch (error) {
    console.warn(`Failed to validate ad set data for ${data?.id}:`, error);
    return {
      id: data?.id || 'unknown',
      name: data?.name || 'Unnamed Ad Set',
      status: 'PAUSED',
      effective_status: undefined,
      daily_budget: undefined,
      lifetime_budget: undefined,
      bid_amount: undefined,
      targeting: undefined,
    };
  }
}

/**
 * Sanitize Facebook Ad data with validation
 */
export function sanitizeFacebookAd(data: any) {
  try {
    const validated = facebookAdDataSchema.parse(data);
    return {
      id: validated.id,
      name: validated.name,
      status: validated.status,
      effective_status: validated.effective_status ?? undefined,
      creative: validated.creative ?? undefined,
    };
  } catch (error) {
    console.warn(`Failed to validate ad data for ${data?.id}:`, error);
    return {
      id: data?.id || 'unknown',
      name: data?.name || 'Unnamed Ad',
      status: 'PAUSED',
      effective_status: undefined,
      creative: undefined,
    };
  }
}

/**
 * Sanitize Facebook Ad Account data with validation
 */
export function sanitizeFacebookAdAccount(data: any) {
  try {
    const validated = facebookAdAccountDataSchema.parse(data);
    return {
      id: validated.id,
      name: validated.name,
      accountStatus: validated.accountStatus,
      currency: validated.currency,
      timezone: validated.timezone,
      businessId: validated.businessId ?? undefined,
      accessType: validated.accessType ?? undefined,
    };
  } catch (error) {
    console.warn(`Failed to validate ad account data for ${data?.id}:`, error);
    return {
      id: data?.id || 'unknown',
      name: data?.name || 'Unnamed Account',
      accountStatus: 1,
      currency: 'USD',
      timezone: 'UTC',
      businessId: undefined,
      accessType: undefined,
    };
  }
}

/**
 * Get budget value from campaign/ad set
 * Returns daily budget if available, otherwise lifetime budget
 * Converts from cents to dollars
 */
export function getBudgetAmount(
  dailyBudget: string | undefined,
  lifetimeBudget: string | undefined
): number {
  if (dailyBudget) {
    return safeParseFloat(dailyBudget, 100);
  }
  if (lifetimeBudget) {
    return safeParseFloat(lifetimeBudget, 100);
  }
  return 0;
}

/**
 * Validate and map Facebook status to database enum
 * Ensures the returned status is valid for the database schema
 */
export function sanitizeFacebookStatus(
  status: string | null | undefined,
  entityType: 'campaign' | 'adset' | 'ad',
  fallback: string = 'PAUSED'
): string {
  if (!status || typeof status !== 'string') {
    return fallback;
  }

  const mappedStatus = mapFacebookStatus(status, entityType);

  // Validate against allowed enum values
  const validStatuses = {
    campaign: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'PENDING', 'ENDED', 'DISAPPROVED', 'REMOVED'],
    adset: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'PENDING', 'ENDED'],
    ad: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED', 'PENDING', 'REVIEW', 'REJECTED', 'DISAPPROVED'],
  };

  const allowedStatuses = validStatuses[entityType];

  if (!allowedStatuses.includes(mappedStatus)) {
    console.warn(
      `Invalid status "${mappedStatus}" for ${entityType}, using fallback "${fallback}"`
    );
    return fallback;
  }

  return mappedStatus;
}

/**
 * Sanitize date string to valid Date object
 * Returns current date if invalid
 */
export function sanitizeDate(dateString: string | null | undefined): Date {
  if (!dateString) {
    return new Date();
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateString}`);
      return new Date();
    }
    return date;
  } catch (error) {
    console.warn(`Failed to parse date: ${dateString}`, error);
    return new Date();
  }
}
