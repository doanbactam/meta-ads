import {
  appRateLimiter,
  adAccountRateLimiter,
  insightsCache,
  entityCache,
  accountCache,
} from './rate-limiter';
import {
  sanitizeFacebookCampaign,
  sanitizeFacebookAdSet,
  sanitizeFacebookAd,
  sanitizeFacebookAdAccount,
} from '@/lib/shared/data-sanitizer';

// Facebook API V23 Error Codes
export const FACEBOOK_ERROR_CODES = {
  INVALID_TOKEN: 190,
  API_TOO_MANY_CALLS: 17,
  API_USER_TOO_MANY_CALLS: 4,
  TEMPORARY_ISSUE: 2,
  RATE_LIMIT_REACHED: 613,
  ACCOUNT_DELETED: 100,
  PERMISSION_DENIED: 200,
} as const;

// Typed error for Facebook token expiry
export class FacebookTokenExpiredError extends Error {
  constructor() {
    super('FACEBOOK_TOKEN_EXPIRED');
    this.name = 'FacebookTokenExpiredError';
  }
}

// Cache TTLs (in milliseconds)
const CACHE_TTL = {
  INSIGHTS: 10 * 60 * 1000, // 10 minutes
  CAMPAIGNS: 3 * 60 * 1000, // 3 minutes
  ADSETS: 3 * 60 * 1000, // 3 minutes
  ADS: 3 * 60 * 1000, // 3 minutes
  ACCOUNTS: 30 * 60 * 1000, // 30 minutes
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

export interface FacebookAdAccountData {
  id: string;
  name: string;
  accountStatus: number;
  currency: string;
  timezone: string;
  businessId?: string;
  accessType?: string; // OWNER, AGENCY, ASSIGNED
}

export interface FacebookCampaignData {
  id: string;
  name: string;
  status: string;
  objective?: string;
  spendCap?: string;
  dailyBudget?: string;
  lifetimeBudget?: string;
}

export interface FacebookCampaignInsights {
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  frequency?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  conversions?: string;
  costPerConversion?: string;
}

// Optimized field sets for API requests to reduce data transfer
const OPTIMIZED_FIELDS = {
  adAccount: 'id,name,account_status,currency,timezone_name',
  campaign: 'id,name,status,effective_status,objective,spend_cap,daily_budget,lifetime_budget',
  adSet: 'id,name,status,effective_status,daily_budget,lifetime_budget,bid_amount,targeting',
  ad: 'id,name,status,effective_status,creative',
  insights: 'impressions,clicks,spend,reach,frequency,ctr,cpc,cpm',
} as const;

export class FacebookMarketingAPI {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    // Removed global SDK init to prevent cross-account token collision
    // Using fetch API directly instead
  }

  /**
   * Fetch all pages from Facebook API with pagination support
   * Facebook API returns max 25-100 items per page, this method fetches all pages
   * Implements rate limiting and exponential backoff
   */
  private async fetchAllPages<T>(
    initialUrl: string,
    maxPages: number = 100,
    rateLimitKey: string = 'default'
  ): Promise<T[]> {
    const allData: T[] = [];
    let nextUrl: string | null = `${initialUrl}&access_token=${this.accessToken}`;
    let pageCount = 0;
    let retryCount = 0;
    const maxRetries = 4;
    const visited = new Set<string>();

    while (nextUrl && pageCount < maxPages) {
      // Prevent pagination loops
      if (visited.has(nextUrl)) {
        console.warn('Detected paging loop, aborting pagination');
        break;
      }
      visited.add(nextUrl);
      // Apply rate limiting
      await appRateLimiter.waitForLimit(rateLimitKey);
      await adAccountRateLimiter.waitForLimit(rateLimitKey);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s

      try {
        const response: Response = await fetch(nextUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check rate limit headers
        const rateLimitRemaining = response.headers.get('x-app-usage');
        const businessUsage = response.headers.get('x-business-use-case-usage');
        
        if (rateLimitRemaining) {
          try {
            const usage = JSON.parse(rateLimitRemaining);
            if (usage.call_count >= 95) {
              console.warn('Approaching Facebook API rate limit:', usage);
              await new Promise((resolve) => setTimeout(resolve, 2000)); // Throttle
            }
          } catch (e) {
            // Ignore parse errors
          }
        }

        if (!response.ok) {
          const errorData: any = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
          const errorCode = errorData.error?.code;

          // Check for token expiry
          if (
            errorMessage.includes('Session has expired') ||
            errorMessage.includes('access token') ||
            errorMessage.includes('token is invalid') ||
            errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN ||
            response.status === 401
          ) {
            throw new FacebookTokenExpiredError();
          }

          // Handle rate limiting with exponential backoff + jitter
          if (
            errorCode === FACEBOOK_ERROR_CODES.API_TOO_MANY_CALLS ||
            errorCode === FACEBOOK_ERROR_CODES.API_USER_TOO_MANY_CALLS ||
            errorCode === FACEBOOK_ERROR_CODES.RATE_LIMIT_REACHED ||
            response.status === 429
          ) {
            if (retryCount < maxRetries) {
              const backoffTime = Math.pow(2, retryCount) * 1000 + Math.floor(Math.random() * 250);
              console.warn(`Rate limit hit, retrying in ${backoffTime}ms (attempt ${retryCount + 1}/${maxRetries})`);
              await new Promise((resolve) => setTimeout(resolve, backoffTime));
              retryCount++;
              continue; // Retry same request
            }
            throw new Error('Facebook API rate limit exceeded. Please try again later.');
          }

          // Handle temporary issues with retry
          if (errorCode === FACEBOOK_ERROR_CODES.TEMPORARY_ISSUE && retryCount < maxRetries) {
            const backoffTime = 1000 * (retryCount + 1);
            console.warn(`Temporary Facebook issue, retrying in ${backoffTime}ms`);
            await new Promise((resolve) => setTimeout(resolve, backoffTime));
            retryCount++;
            continue;
          }

          throw new Error(errorMessage);
        }

        // Reset retry count on successful response
        retryCount = 0;

        const data: any = await response.json();

        if (data.error) {
          const errorCode = data.error.code;
          if (errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
            throw new FacebookTokenExpiredError();
          }
          throw new Error(data.error.message);
        }

        // Add current page data
        if (data.data && Array.isArray(data.data)) {
          allData.push(...data.data);
        }

        // Get next page URL from paging object
        nextUrl = data.paging?.next || null;
        pageCount++;

        // Log pagination progress
        if (nextUrl) {
          console.log(`Fetched page ${pageCount}, total items: ${allData.length}, fetching next page...`);
        }

      } catch (error) {
        clearTimeout(timeoutId);
        
        // Re-throw token expiry errors
        if (error instanceof FacebookTokenExpiredError) {
          throw error;
        }

        // Handle network errors
        const isNetworkError =
          error instanceof Error &&
          (error.name === 'AbortError' ||
            error.message.includes('timeout') ||
            error.message.includes('fetch failed'));

        throw new Error(
          isNetworkError
            ? 'Unable to connect to Facebook. Please check your internet connection.'
            : error instanceof Error
              ? error.message
              : 'Unknown error during pagination'
        );
      }
    }

    console.log(`Pagination complete: fetched ${allData.length} items across ${pageCount} pages`);
    return allData;
  }

  async validateToken(): Promise<FacebookTokenValidation> {
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(
          `https://graph.facebook.com/v23.0/debug_token?input_token=${this.accessToken}&access_token=${this.accessToken}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return {
            isValid: false,
            error: errorData.error?.message || `HTTP ${response.status}: Failed to validate token`,
          };
        }

        const data = await response.json();

        if (data.error) {
          return {
            isValid: false,
            error: data.error.message || 'Token validation failed',
          };
        }

        const tokenData = data.data;

        if (!tokenData) {
          return {
            isValid: false,
            error: 'Invalid response from Facebook API',
          };
        }

        // Parse granular_scopes to extract business IDs
        const granularScopes = tokenData.granular_scopes || [];
        const businessIds: string[] = [];
        
        for (const gs of granularScopes) {
          if (
            (gs.scope === 'ads_management' || 
             gs.scope === 'business_management' ||
             gs.scope === 'ads_read') &&
            gs.target_ids &&
            Array.isArray(gs.target_ids)
          ) {
            businessIds.push(...gs.target_ids);
          }
        }

        // Remove duplicates
        const uniqueBusinessIds = Array.from(new Set(businessIds));

        return {
          isValid: tokenData.is_valid || false,
          appId: tokenData.app_id,
          userId: tokenData.user_id,
          expiresAt: tokenData.expires_at,
          scopes: tokenData.scopes || [],
          businessIds: uniqueBusinessIds.length > 0 ? uniqueBusinessIds : undefined,
          granularScopes: granularScopes.length > 0 ? granularScopes : undefined,
          error: !tokenData.is_valid ? 'Token is not valid' : undefined,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Check if it's a timeout or connection error
        const isNetworkError =
          lastError.name === 'AbortError' ||
          lastError.message.includes('timeout') ||
          lastError.message.includes('ECONNREFUSED') ||
          lastError.message.includes('ETIMEDOUT') ||
          lastError.message.includes('ConnectTimeoutError');

        // Only retry on network errors
        if (isNetworkError && attempt < maxRetries) {
          console.log(`Token validation attempt ${attempt + 1} failed, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }

        console.error('Token validation error:', error);
        return {
          isValid: false,
          error: isNetworkError
            ? 'Unable to connect to Facebook. Please check your internet connection and try again.'
            : lastError.message || 'Unknown error occurred during validation',
        };
      }
    }

    return {
      isValid: false,
      error: 'Connection timeout. Please check your internet connection and try again.',
    };
  }

  /**
   * Get ad accounts for a specific business (owned + client accounts)
   * This is the recommended approach when user grants permission to specific businesses
   */
  async getBusinessAdAccounts(businessId: string): Promise<FacebookAdAccountData[]> {
    try {
      console.log(`Fetching ad accounts for business ${businessId}`);
      
      // Fetch both owned and client accounts in parallel
      const [ownedAccounts, clientAccounts] = await Promise.all([
        this.getBusinessOwnedAccounts(businessId),
        this.getBusinessClientAccounts(businessId).catch((err) => {
          console.warn(`Could not fetch client accounts for business ${businessId}:`, err.message);
          return [];
        }),
      ]);

      // Combine and deduplicate by account ID
      const allAccounts = [...ownedAccounts, ...clientAccounts];
      const uniqueAccounts = allAccounts.filter(
        (account, index, self) => index === self.findIndex((a) => a.id === account.id)
      );

      console.log(
        `Found ${uniqueAccounts.length} ad accounts for business ${businessId} (${ownedAccounts.length} owned, ${clientAccounts.length} client)`
      );

      return uniqueAccounts;
    } catch (error) {
      console.error(`Error fetching business ad accounts for ${businessId}:`, error);
      throw error;
    }
  }

  /**
   * Get ad accounts owned by a business
   */
  private async getBusinessOwnedAccounts(businessId: string): Promise<FacebookAdAccountData[]> {
    try {
      const url = `https://graph.facebook.com/v23.0/${businessId}/owned_ad_accounts?fields=${OPTIMIZED_FIELDS.adAccount},business_id,access_type&limit=100`;
      const accounts = await this.fetchAllPages<any>(url);

      return accounts.map((account: any) =>
        sanitizeFacebookAdAccount({
          id: account.id,
          name: account.name,
          accountStatus: account.account_status,
          currency: account.currency,
          timezone: account.timezone_name,
          businessId: account.business_id || businessId,
          accessType: account.access_type || 'OWNER',
        })
      );
    } catch (error) {
      console.error(`Error fetching owned accounts for business ${businessId}:`, error);
      throw error;
    }
  }

  /**
   * Get ad accounts that the business manages for clients (agency accounts)
   */
  private async getBusinessClientAccounts(businessId: string): Promise<FacebookAdAccountData[]> {
    try {
      const url = `https://graph.facebook.com/v23.0/${businessId}/client_ad_accounts?fields=${OPTIMIZED_FIELDS.adAccount},business_id,access_type&limit=100`;
      const accounts = await this.fetchAllPages<any>(url);

      return accounts.map((account: any) =>
        sanitizeFacebookAdAccount({
          id: account.id,
          name: account.name,
          accountStatus: account.account_status,
          currency: account.currency,
          timezone: account.timezone_name,
          businessId: account.business_id || businessId,
          accessType: account.access_type || 'AGENCY',
        })
      );
    } catch (error) {
      // Client accounts endpoint may fail if business doesn't have agency access
      // This is expected and should not break the flow
      throw error;
    }
  }

  /**
   * Get all ad accounts associated with the user (legacy method)
   * @deprecated Use getBusinessAdAccounts() when possible for better business scope control
   */
  async getUserAdAccounts(): Promise<FacebookAdAccountData[]> {
    try {
      // Check cache first
      const cacheKey = `adaccounts:user`;
      const cached = accountCache.get(cacheKey);
      if (cached) {
        console.log('Cache hit for user ad accounts');
        return cached;
      }

      // Apply rate limiting
      await appRateLimiter.waitForLimit('adaccounts:user');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Use optimized field selection
      const response = await fetch(
        `https://graph.facebook.com/v23.0/me/adaccounts?fields=${OPTIMIZED_FIELDS.adAccount}&access_token=${this.accessToken}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error?.message || `HTTP ${response.status}: Failed to fetch ad accounts`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Failed to fetch ad accounts');
      }

      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      const result = data.data.map((account: any) => {
        // Sanitize and validate each account
        return sanitizeFacebookAdAccount({
          id: account.id,
          name: account.name,
          accountStatus: account.account_status,
          currency: account.currency,
          timezone: account.timezone_name,
        });
      });

      // Cache the result
      accountCache.set(cacheKey, result, CACHE_TTL.ACCOUNTS);

      return result;
    } catch (error) {
      console.error('Error fetching ad accounts:', error);
      const isNetworkError =
        error instanceof Error &&
        (error.name === 'AbortError' ||
          error.message.includes('timeout') ||
          error.message.includes('fetch failed'));

      throw new Error(
        isNetworkError
          ? 'Unable to connect to Facebook. Please check your internet connection.'
          : error instanceof Error
            ? error.message
            : 'Unknown error fetching ad accounts'
      );
    }
  }

  async getCampaigns(adAccountId: string): Promise<FacebookCampaignData[]> {
    try {
      const formattedAccountId = adAccountId.startsWith('act_')
        ? adAccountId
        : `act_${adAccountId}`;

      // Check cache first
      const cacheKey = `campaigns:${formattedAccountId}`;
      const cached = entityCache.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for campaigns: ${formattedAccountId}`);
        return cached;
      }

      // Use pagination helper to fetch all campaigns
      const url = `https://graph.facebook.com/v23.0/${formattedAccountId}/campaigns?fields=${OPTIMIZED_FIELDS.campaign}&limit=100`;
      const campaigns = await this.fetchAllPages<any>(url, 100, `campaigns:${formattedAccountId}`);

      const result = campaigns.map((campaign: any) =>
        sanitizeFacebookCampaign({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          spendCap: campaign.spend_cap,
          dailyBudget: campaign.daily_budget,
          lifetimeBudget: campaign.lifetime_budget,
        })
      );

      // Cache the result
      entityCache.set(cacheKey, result, CACHE_TTL.CAMPAIGNS);

      return result;
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      
      // Re-throw token expiry errors
      if (error instanceof FacebookTokenExpiredError) {
        throw error;
      }

      const isNetworkError =
        error instanceof Error &&
        (error.name === 'AbortError' ||
          error.message.includes('timeout') ||
          error.message.includes('fetch failed'));

      throw new Error(
        isNetworkError
          ? 'Unable to connect to Facebook. Please check your internet connection.'
          : error instanceof Error
            ? error.message
            : 'Unknown error fetching campaigns'
      );
    }
  }

  async getCampaignInsights(
    campaignId: string,
    options?: { datePreset?: string; dateFrom?: string; dateTo?: string }
  ): Promise<FacebookCampaignInsights | null> {
    try {
      // Use optimized field selection
      let dateParams = '';
      if (options?.dateFrom && options?.dateTo) {
        const timeRange = encodeURIComponent(
          JSON.stringify({ since: options.dateFrom, until: options.dateTo })
        );
        dateParams = `&time_range=${timeRange}`;
      } else if (options?.datePreset) {
        dateParams = `&date_preset=${options.datePreset}`;
      } else {
        dateParams = '&date_preset=last_30d';
      }

      // Check cache first
      const cacheKey = `insights:campaign:${campaignId}:${dateParams}`;
      const cached = insightsCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Apply rate limiting
      await appRateLimiter.waitForLimit(`insights:${campaignId}`);
      await adAccountRateLimiter.waitForLimit(`insights:${campaignId}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(
        `https://graph.facebook.com/v23.0/${campaignId}/insights?fields=${OPTIMIZED_FIELDS.insights}${dateParams}&access_token=${this.accessToken}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Failed to fetch campaign insights';
        const errorCode = errorData.error?.code;

        // Check if it's a token expiry error
        if (
          errorMessage.includes('Session has expired') ||
          errorMessage.includes('access token') ||
          errorMessage.includes('token is invalid') ||
          errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN ||
          response.status === 401
        ) {
          throw new FacebookTokenExpiredError();
        }

        console.warn(`Campaign insights error for ${campaignId}:`, errorMessage);
        return null;
      }

      const data = await response.json();

      if (data.error) {
        const errorCode = data.error.code;
        if (errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
          throw new FacebookTokenExpiredError();
        }
        console.warn(`Campaign insights error for ${campaignId}:`, data.error.message);
        return null;
      }

      if (!data.data || data.data.length === 0) {
        // Cache null result for shorter duration to avoid repeated calls
        insightsCache.set(cacheKey, null, 2 * 60 * 1000); // 2 minutes
        return null;
      }

      const insights = data.data[0];

      const result = {
        impressions: insights.impressions,
        clicks: insights.clicks,
        spend: insights.spend,
        reach: insights.reach,
        frequency: insights.frequency,
        ctr: insights.ctr,
        cpc: insights.cpc,
        cpm: insights.cpm,
      };

      // Cache the result
      insightsCache.set(cacheKey, result, CACHE_TTL.INSIGHTS);

      return result;
    } catch (error) {
      // Re-throw token expiry errors
      if (error instanceof FacebookTokenExpiredError) {
        throw error;
      }
      console.error('Error fetching campaign insights:', error);
      return null;
    }
  }

  async getAdSets(campaignId: string) {
    try {
      // Check cache first
      const cacheKey = `adsets:${campaignId}`;
      const cached = entityCache.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for ad sets: ${campaignId}`);
        return cached;
      }

      // Use pagination helper to fetch all ad sets
      const url = `https://graph.facebook.com/v23.0/${campaignId}/adsets?fields=${OPTIMIZED_FIELDS.adSet}&limit=100`;
      const adSets = await this.fetchAllPages<any>(url, 100, `adsets:${campaignId}`);

      // Sanitize ad sets before caching
      const sanitizedAdSets = adSets.map((adSet: any) =>
        sanitizeFacebookAdSet({
          id: adSet.id,
          name: adSet.name,
          status: adSet.status,
          effective_status: adSet.effective_status,
          daily_budget: adSet.daily_budget,
          lifetime_budget: adSet.lifetime_budget,
          bid_amount: adSet.bid_amount,
          targeting: adSet.targeting,
        })
      );

      // Cache the result
      entityCache.set(cacheKey, sanitizedAdSets, CACHE_TTL.ADSETS);

      return sanitizedAdSets;
    } catch (error) {
      console.error('Error fetching ad sets:', error);
      
      // Re-throw token expiry errors
      if (error instanceof FacebookTokenExpiredError) {
        throw error;
      }

      const isNetworkError =
        error instanceof Error &&
        (error.name === 'AbortError' ||
          error.message.includes('timeout') ||
          error.message.includes('fetch failed'));

      throw new Error(
        isNetworkError
          ? 'Unable to connect to Facebook. Please check your internet connection.'
          : error instanceof Error
            ? error.message
            : 'Unknown error fetching ad sets'
      );
    }
  }

  async getAdSetInsights(
    adSetId: string,
    options?: { datePreset?: string; dateFrom?: string; dateTo?: string }
  ): Promise<FacebookCampaignInsights | null> {
    try {
      // Use optimized field selection
      let dateParams = '';
      if (options?.dateFrom && options?.dateTo) {
        const timeRange = encodeURIComponent(
          JSON.stringify({ since: options.dateFrom, until: options.dateTo })
        );
        dateParams = `&time_range=${timeRange}`;
      } else if (options?.datePreset) {
        dateParams = `&date_preset=${options.datePreset}`;
      } else {
        dateParams = '&date_preset=last_30d';
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `https://graph.facebook.com/v23.0/${adSetId}/insights?fields=${OPTIMIZED_FIELDS.insights}${dateParams}&access_token=${this.accessToken}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Failed to fetch ad set insights';
        const errorCode = errorData.error?.code;

        // Check if it's a token expiry error
        if (
          errorMessage.includes('Session has expired') ||
          errorMessage.includes('access token') ||
          errorMessage.includes('token is invalid') ||
          errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN ||
          response.status === 401
        ) {
          throw new FacebookTokenExpiredError();
        }

        console.warn(`Ad set insights error for ${adSetId}:`, errorMessage);
        return null;
      }

      const data = await response.json();

      if (data.error) {
        const errorCode = data.error.code;
        if (errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
          throw new FacebookTokenExpiredError();
        }
        console.warn(`Ad set insights error for ${adSetId}:`, data.error.message);
        return null;
      }

      if (!data.data || data.data.length === 0) {
        return null;
      }

      const insights = data.data[0];

      return {
        impressions: insights.impressions,
        clicks: insights.clicks,
        spend: insights.spend,
        reach: insights.reach,
        frequency: insights.frequency,
        ctr: insights.ctr,
        cpc: insights.cpc,
        cpm: insights.cpm,
      };
    } catch (error) {
      // Re-throw token expiry errors
      if (error instanceof FacebookTokenExpiredError) {
        throw error;
      }
      console.error('Error fetching ad set insights:', error);
      return null;
    }
  }

  async getAds(adSetId: string) {
    try {
      // Check cache first
      const cacheKey = `ads:${adSetId}`;
      const cached = entityCache.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for ads: ${adSetId}`);
        return cached;
      }

      // Use pagination helper to fetch all ads
      const url = `https://graph.facebook.com/v23.0/${adSetId}/ads?fields=${OPTIMIZED_FIELDS.ad}&limit=100`;
      const ads = await this.fetchAllPages<any>(url, 100, `ads:${adSetId}`);

      // Sanitize ads before caching
      const sanitizedAds = ads.map((ad: any) =>
        sanitizeFacebookAd({
          id: ad.id,
          name: ad.name,
          status: ad.status,
          effective_status: ad.effective_status,
          creative: ad.creative,
        })
      );

      // Cache the result
      entityCache.set(cacheKey, sanitizedAds, CACHE_TTL.ADS);

      return sanitizedAds;
    } catch (error) {
      console.error('Error fetching ads:', error);
      
      // Re-throw token expiry errors
      if (error instanceof FacebookTokenExpiredError) {
        throw error;
      }

      const isNetworkError =
        error instanceof Error &&
        (error.name === 'AbortError' ||
          error.message.includes('timeout') ||
          error.message.includes('fetch failed'));

      throw new Error(
        isNetworkError
          ? 'Unable to connect to Facebook. Please check your internet connection.'
          : error instanceof Error
            ? error.message
            : 'Unknown error fetching ads'
      );
    }
  }

  async getAdInsights(
    adId: string,
    options?: { datePreset?: string; dateFrom?: string; dateTo?: string }
  ): Promise<FacebookCampaignInsights | null> {
    try {
      // Use optimized field selection
      let dateParams = '';
      if (options?.dateFrom && options?.dateTo) {
        const timeRange = encodeURIComponent(
          JSON.stringify({ since: options.dateFrom, until: options.dateTo })
        );
        dateParams = `&time_range=${timeRange}`;
      } else if (options?.datePreset) {
        dateParams = `&date_preset=${options.datePreset}`;
      } else {
        dateParams = '&date_preset=last_30d';
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        `https://graph.facebook.com/v23.0/${adId}/insights?fields=${OPTIMIZED_FIELDS.insights}${dateParams}&access_token=${this.accessToken}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Failed to fetch ad insights';
        const errorCode = errorData.error?.code;

        // Check if it's a token expiry error
        if (
          errorMessage.includes('Session has expired') ||
          errorMessage.includes('access token') ||
          errorMessage.includes('token is invalid') ||
          errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN ||
          response.status === 401
        ) {
          throw new FacebookTokenExpiredError();
        }

        console.warn(`Ad insights error for ${adId}:`, errorMessage);
        return null;
      }

      const data = await response.json();

      if (data.error) {
        const errorCode = data.error.code;
        if (errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
          throw new FacebookTokenExpiredError();
        }
        console.warn(`Ad insights error for ${adId}:`, data.error.message);
        return null;
      }

      if (!data.data || data.data.length === 0) {
        return null;
      }

      const insights = data.data[0];

      return {
        impressions: insights.impressions,
        clicks: insights.clicks,
        spend: insights.spend,
        reach: insights.reach,
        frequency: insights.frequency,
        ctr: insights.ctr,
        cpc: insights.cpc,
        cpm: insights.cpm,
      };
    } catch (error) {
      // Re-throw token expiry errors
      if (error instanceof FacebookTokenExpiredError) {
        throw error;
      }
      console.error('Error fetching ad insights:', error);
      return null;
    }
  }
}

export async function verifyFacebookConnection(accessToken: string): Promise<boolean> {
  try {
    const api = new FacebookMarketingAPI(accessToken);
    const validation = await api.validateToken();
    return validation.isValid;
  } catch (error) {
    console.error('Error verifying Facebook connection:', error);
    return false;
  }
}
