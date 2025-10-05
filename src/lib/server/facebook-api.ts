import { Ad, AdAccount, AdSet, Campaign, FacebookAdsApi } from 'facebook-nodejs-business-sdk';

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

export interface FacebookTokenValidation {
  isValid: boolean;
  appId?: string;
  userId?: string;
  expiresAt?: number;
  scopes?: string[];
  error?: string;
}

export interface FacebookAdAccountData {
  id: string;
  name: string;
  accountStatus: number;
  currency: string;
  timezone: string;
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
    FacebookAdsApi.init(accessToken);
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

        return {
          isValid: tokenData.is_valid || false,
          appId: tokenData.app_id,
          userId: tokenData.user_id,
          expiresAt: tokenData.expires_at,
          scopes: tokenData.scopes || [],
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

  async getUserAdAccounts(): Promise<FacebookAdAccountData[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

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

      return data.data.map((account: any) => ({
        id: account.id,
        name: account.name || 'Unnamed Account',
        accountStatus: account.account_status || 1,
        currency: account.currency || 'USD',
        timezone: account.timezone_name || 'UTC',
      }));
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Use optimized field selection to reduce data transfer
      const response = await fetch(
        `https://graph.facebook.com/v23.0/${formattedAccountId}/campaigns?fields=${OPTIMIZED_FIELDS.campaign}&access_token=${this.accessToken}`,
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
          errorData.error?.message || `HTTP ${response.status}: Failed to fetch campaigns`;
        const errorCode = errorData.error?.code;

        // Check if it's a token expiry error using standardized error codes
        if (
          errorMessage.includes('Session has expired') ||
          errorMessage.includes('access token') ||
          errorMessage.includes('token is invalid') ||
          errorMessage.includes('Error validating access token') ||
          errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN ||
          response.status === 401
        ) {
          throw new Error('FACEBOOK_TOKEN_EXPIRED');
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.error) {
        const errorMessage = data.error.message || 'Failed to fetch campaigns';
        const errorCode = data.error.code;

        // Check if it's a token expiry error using standardized error codes
        if (
          errorMessage.includes('Session has expired') ||
          errorMessage.includes('access token') ||
          errorMessage.includes('token is invalid') ||
          errorMessage.includes('Error validating access token') ||
          errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN
        ) {
          throw new Error('FACEBOOK_TOKEN_EXPIRED');
        }

        throw new Error(errorMessage);
      }

      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name || 'Unnamed Campaign',
        status: campaign.status || 'UNKNOWN',
        objective: campaign.objective,
        spendCap: campaign.spend_cap,
        dailyBudget: campaign.daily_budget,
        lifetimeBudget: campaign.lifetime_budget,
      }));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
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
        dateParams = `&time_range={"since":"${options.dateFrom}","until":"${options.dateTo}"}`;
      } else if (options?.datePreset) {
        dateParams = `&date_preset=${options.datePreset}`;
      } else {
        dateParams = '&date_preset=last_30d';
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

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
          throw new Error('FACEBOOK_TOKEN_EXPIRED');
        }

        console.warn(`Campaign insights error for ${campaignId}:`, errorMessage);
        return null;
      }

      const data = await response.json();

      if (data.error) {
        const errorCode = data.error.code;
        if (errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
          throw new Error('FACEBOOK_TOKEN_EXPIRED');
        }
        console.warn(`Campaign insights error for ${campaignId}:`, data.error.message);
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
      if (error instanceof Error && error.message === 'FACEBOOK_TOKEN_EXPIRED') {
        throw error;
      }
      console.error('Error fetching campaign insights:', error);
      return null;
    }
  }

  async getAdSets(campaignId: string) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Use optimized field selection
      const response = await fetch(
        `https://graph.facebook.com/v23.0/${campaignId}/adsets?fields=${OPTIMIZED_FIELDS.adSet}&access_token=${this.accessToken}`,
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
          errorData.error?.message || `HTTP ${response.status}: Failed to fetch ad sets`;
        const errorCode = errorData.error?.code;

        // Check if it's a token expiry error using standardized error codes
        if (
          errorMessage.includes('Session has expired') ||
          errorMessage.includes('access token') ||
          errorMessage.includes('token is invalid') ||
          errorMessage.includes('Error validating access token') ||
          errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN ||
          response.status === 401
        ) {
          throw new Error('FACEBOOK_TOKEN_EXPIRED');
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.error) {
        const errorMessage = data.error.message || 'Failed to fetch ad sets';
        const errorCode = data.error.code;

        // Check if it's a token expiry error using standardized error codes
        if (
          errorMessage.includes('Session has expired') ||
          errorMessage.includes('access token') ||
          errorMessage.includes('token is invalid') ||
          errorMessage.includes('Error validating access token') ||
          errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN
        ) {
          throw new Error('FACEBOOK_TOKEN_EXPIRED');
        }

        throw new Error(errorMessage);
      }

      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching ad sets:', error);
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
        dateParams = `&time_range={"since":"${options.dateFrom}","until":"${options.dateTo}"}`;
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
          throw new Error('FACEBOOK_TOKEN_EXPIRED');
        }

        console.warn(`Ad set insights error for ${adSetId}:`, errorMessage);
        return null;
      }

      const data = await response.json();

      if (data.error) {
        const errorCode = data.error.code;
        if (errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
          throw new Error('FACEBOOK_TOKEN_EXPIRED');
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
      if (error instanceof Error && error.message === 'FACEBOOK_TOKEN_EXPIRED') {
        throw error;
      }
      console.error('Error fetching ad set insights:', error);
      return null;
    }
  }

  async getAds(adSetId: string) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Use optimized field selection
      const response = await fetch(
        `https://graph.facebook.com/v23.0/${adSetId}/ads?fields=${OPTIMIZED_FIELDS.ad}&access_token=${this.accessToken}`,
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
          errorData.error?.message || `HTTP ${response.status}: Failed to fetch ads`;
        const errorCode = errorData.error?.code;

        // Check if it's a token expiry error using standardized error codes
        if (
          errorMessage.includes('Session has expired') ||
          errorMessage.includes('access token') ||
          errorMessage.includes('token is invalid') ||
          errorMessage.includes('Error validating access token') ||
          errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN ||
          response.status === 401
        ) {
          throw new Error('FACEBOOK_TOKEN_EXPIRED');
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.error) {
        const errorMessage = data.error.message || 'Failed to fetch ads';
        const errorCode = data.error.code;

        // Check if it's a token expiry error using standardized error codes
        if (
          errorMessage.includes('Session has expired') ||
          errorMessage.includes('access token') ||
          errorMessage.includes('token is invalid') ||
          errorMessage.includes('Error validating access token') ||
          errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN
        ) {
          throw new Error('FACEBOOK_TOKEN_EXPIRED');
        }

        throw new Error(errorMessage);
      }

      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching ads:', error);
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
        dateParams = `&time_range={"since":"${options.dateFrom}","until":"${options.dateTo}"}`;
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
          throw new Error('FACEBOOK_TOKEN_EXPIRED');
        }

        console.warn(`Ad insights error for ${adId}:`, errorMessage);
        return null;
      }

      const data = await response.json();

      if (data.error) {
        const errorCode = data.error.code;
        if (errorCode === FACEBOOK_ERROR_CODES.INVALID_TOKEN) {
          throw new Error('FACEBOOK_TOKEN_EXPIRED');
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
      if (error instanceof Error && error.message === 'FACEBOOK_TOKEN_EXPIRED') {
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
