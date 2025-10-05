import { FacebookAdsApi, AdAccount, Campaign, AdSet, Ad } from 'facebook-nodejs-business-sdk';

// ============================================================================
// Facebook API V23 Optimized Implementation
// ============================================================================
// This implementation follows Facebook Marketing API v23 best practices:
// 1. Batch API requests to reduce number of calls
// 2. Field selection to minimize data transfer
// 3. Async insights for better performance
// 4. Proper pagination with cursors
// 5. Enhanced error handling with retry logic
// 6. Rate limiting awareness
// 7. ETag support for caching
// ============================================================================

// Facebook API Error Codes
export const FACEBOOK_ERROR_CODES = {
  INVALID_TOKEN: 190,
  API_TOO_MANY_CALLS: 17,
  API_USER_TOO_MANY_CALLS: 4,
  TEMPORARY_ISSUE: 2,
  RATE_LIMIT_REACHED: 613,
  ACCOUNT_DELETED: 100,
  PERMISSION_DENIED: 200,
} as const;

// Custom error type with Facebook-specific properties
export interface FacebookError extends Error {
  code?: number;
  type?: string;
  errorSubcode?: number;
  fbtrace_id?: string;
  statusCode?: number;
}

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
  amountSpent?: string;
  balance?: string;
  spendCap?: string;
}

export interface FacebookCampaignData {
  id: string;
  name: string;
  status: string;
  objective?: string;
  spendCap?: string;
  dailyBudget?: string;
  lifetimeBudget?: string;
  createdTime?: string;
  updatedTime?: string;
  effectiveStatus?: string;
}

export interface FacebookAdSetData {
  id: string;
  name: string;
  status: string;
  dailyBudget?: string;
  lifetimeBudget?: string;
  bidAmount?: string;
  targeting?: any;
  effectiveStatus?: string;
  createdTime?: string;
  updatedTime?: string;
}

export interface FacebookAdData {
  id: string;
  name: string;
  status: string;
  creative?: any;
  effectiveStatus?: string;
  createdTime?: string;
  updatedTime?: string;
}

export interface FacebookInsights {
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  frequency?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  cpp?: string;
  conversions?: string;
  costPerConversion?: string;
  actions?: any[];
  actionValues?: any[];
  dateStart?: string;
  dateStop?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
  summary?: any;
}

export interface BatchRequest {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
  relativeUrl: string;
  name?: string;
  omitResponseOnSuccess?: boolean;
  dependsOn?: string;
}

export interface BatchResponse<T = any> {
  code: number;
  headers: Array<{ name: string; value: string }>;
  body: string;
  data?: T;
}

// Optimized field sets for different resources
export const FIELD_SETS = {
  adAccount: [
    'id',
    'name',
    'account_status',
    'currency',
    'timezone_name',
    'amount_spent',
    'balance',
    'spend_cap',
  ].join(','),
  
  campaign: [
    'id',
    'name',
    'status',
    'effective_status',
    'objective',
    'spend_cap',
    'daily_budget',
    'lifetime_budget',
    'created_time',
    'updated_time',
  ].join(','),
  
  adSet: [
    'id',
    'name',
    'status',
    'effective_status',
    'daily_budget',
    'lifetime_budget',
    'bid_amount',
    'targeting',
    'created_time',
    'updated_time',
  ].join(','),
  
  ad: [
    'id',
    'name',
    'status',
    'effective_status',
    'creative',
    'created_time',
    'updated_time',
  ].join(','),
  
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
    'date_start',
    'date_stop',
  ].join(','),
} as const;

export class FacebookMarketingAPIOptimized {
  private accessToken: string;
  private apiVersion = 'v23.0';
  private baseUrl = 'https://graph.facebook.com';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    FacebookAdsApi.init(accessToken);
  }

  // ============================================================================
  // Core API Methods
  // ============================================================================

  /**
   * Makes a GET request to Facebook Graph API with optimized error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: {
      timeout?: number;
      retries?: number;
      etag?: string;
    } = {}
  ): Promise<{ data: T; etag?: string }> {
    const { timeout = 15000, retries = 2, etag } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const headers: HeadersInit = {
          'Accept': 'application/json',
        };

        // Add ETag for caching
        if (etag) {
          headers['If-None-Match'] = etag;
        }

        const url = `${this.baseUrl}/${this.apiVersion}/${endpoint}`;
        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle 304 Not Modified (cache hit)
        if (response.status === 304) {
          return { data: null as T, etag };
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = this.createFacebookError(errorData, response.status);
          
          // Check if we should retry
          if (this.shouldRetry(error.code, attempt, retries)) {
            await this.waitBeforeRetry(attempt);
            continue;
          }
          
          throw error;
        }

        const data = await response.json();
        const responseEtag = response.headers.get('etag') || undefined;

        return { data, etag: responseEtag };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if it's a network error that should be retried
        const isNetworkError = this.isNetworkError(lastError);
        
        if (isNetworkError && attempt < retries) {
          console.log(`Request attempt ${attempt + 1} failed, retrying...`);
          await this.waitBeforeRetry(attempt);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Makes a batch request to Facebook API
   */
  async makeBatchRequest<T = any>(
    requests: BatchRequest[]
  ): Promise<BatchResponse<T>[]> {
    const batchParam = JSON.stringify(requests);
    
    const response = await fetch(
      `${this.baseUrl}/${this.apiVersion}?batch=${encodeURIComponent(batchParam)}&access_token=${this.accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw this.createFacebookError(errorData, response.status);
    }

    const results: BatchResponse<T>[] = await response.json();
    
    // Parse body strings into objects
    return results.map(result => ({
      ...result,
      data: result.body ? JSON.parse(result.body) : undefined,
    }));
  }

  // ============================================================================
  // Token Validation
  // ============================================================================

  async validateToken(): Promise<FacebookTokenValidation> {
    try {
      const { data } = await this.makeRequest<any>(
        `debug_token?input_token=${this.accessToken}&access_token=${this.accessToken}`
      );

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
      console.error('Token validation error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during validation',
      };
    }
  }

  // ============================================================================
  // Ad Accounts
  // ============================================================================

  async getUserAdAccounts(): Promise<FacebookAdAccountData[]> {
    try {
      const { data } = await this.makeRequest<PaginatedResponse<any>>(
        `me/adaccounts?fields=${FIELD_SETS.adAccount}`
      );

      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.map(this.mapAdAccountData);
    } catch (error) {
      console.error('Error fetching ad accounts:', error);
      throw this.normalizeError(error);
    }
  }

  async getAdAccount(adAccountId: string): Promise<FacebookAdAccountData> {
    const formattedId = this.formatAccountId(adAccountId);
    
    try {
      const { data } = await this.makeRequest<any>(
        `${formattedId}?fields=${FIELD_SETS.adAccount}`
      );

      return this.mapAdAccountData(data);
    } catch (error) {
      console.error('Error fetching ad account:', error);
      throw this.normalizeError(error);
    }
  }

  // ============================================================================
  // Campaigns with Batch Optimization
  // ============================================================================

  async getCampaigns(
    adAccountId: string,
    options?: {
      limit?: number;
      after?: string;
      filtering?: any[];
    }
  ): Promise<PaginatedResponse<FacebookCampaignData>> {
    const formattedId = this.formatAccountId(adAccountId);
    
    try {
      let url = `${formattedId}/campaigns?fields=${FIELD_SETS.campaign}`;
      
      if (options?.limit) {
        url += `&limit=${options.limit}`;
      }
      
      if (options?.after) {
        url += `&after=${options.after}`;
      }
      
      if (options?.filtering) {
        url += `&filtering=${JSON.stringify(options.filtering)}`;
      }

      const { data } = await this.makeRequest<PaginatedResponse<any>>(url);

      return {
        data: (data.data || []).map(this.mapCampaignData),
        paging: data.paging,
        summary: data.summary,
      };
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw this.normalizeError(error);
    }
  }

  /**
   * Fetch campaigns with insights in parallel using batch API
   */
  async getCampaignsWithInsights(
    adAccountId: string,
    options?: {
      datePreset?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    }
  ): Promise<Array<FacebookCampaignData & { insights?: FacebookInsights }>> {
    const formattedId = this.formatAccountId(adAccountId);
    
    // First, get campaigns
    const campaignsResponse = await this.getCampaigns(adAccountId, { limit: options?.limit });
    const campaigns = campaignsResponse.data;

    if (campaigns.length === 0) {
      return [];
    }

    // Build batch request for all campaign insights
    const dateParams = this.buildDateParams(options);
    const batchRequests: BatchRequest[] = campaigns.map((campaign, index) => ({
      method: 'GET',
      relativeUrl: `${this.apiVersion}/${campaign.id}/insights?fields=${FIELD_SETS.insights}${dateParams}`,
      name: `insights_${index}`,
    }));

    try {
      const batchResults = await this.makeBatchRequest(batchRequests);

      // Merge campaigns with insights
      return campaigns.map((campaign, index) => {
        const result = batchResults[index];
        let insights: FacebookInsights | undefined;

        if (result.code === 200 && result.data?.data?.[0]) {
          insights = this.mapInsightsData(result.data.data[0]);
        }

        return {
          ...campaign,
          insights,
        };
      });
    } catch (error) {
      console.error('Error fetching campaigns with insights:', error);
      // Fallback: return campaigns without insights
      return campaigns;
    }
  }

  async getCampaignInsights(
    campaignId: string,
    options?: {
      datePreset?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<FacebookInsights | null> {
    try {
      const dateParams = this.buildDateParams(options);
      const { data } = await this.makeRequest<PaginatedResponse<any>>(
        `${campaignId}/insights?fields=${FIELD_SETS.insights}${dateParams}`
      );

      if (!data.data || data.data.length === 0) {
        return null;
      }

      return this.mapInsightsData(data.data[0]);
    } catch (error) {
      console.error('Error fetching campaign insights:', error);
      return null;
    }
  }

  // ============================================================================
  // Ad Sets with Batch Optimization
  // ============================================================================

  async getAdSets(
    campaignId: string,
    options?: {
      limit?: number;
      after?: string;
    }
  ): Promise<PaginatedResponse<FacebookAdSetData>> {
    try {
      let url = `${campaignId}/adsets?fields=${FIELD_SETS.adSet}`;
      
      if (options?.limit) {
        url += `&limit=${options.limit}`;
      }
      
      if (options?.after) {
        url += `&after=${options.after}`;
      }

      const { data } = await this.makeRequest<PaginatedResponse<any>>(url);

      return {
        data: (data.data || []).map(this.mapAdSetData),
        paging: data.paging,
        summary: data.summary,
      };
    } catch (error) {
      console.error('Error fetching ad sets:', error);
      throw this.normalizeError(error);
    }
  }

  async getAdSetsWithInsights(
    campaignId: string,
    options?: {
      datePreset?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    }
  ): Promise<Array<FacebookAdSetData & { insights?: FacebookInsights }>> {
    const adSetsResponse = await this.getAdSets(campaignId, { limit: options?.limit });
    const adSets = adSetsResponse.data;

    if (adSets.length === 0) {
      return [];
    }

    const dateParams = this.buildDateParams(options);
    const batchRequests: BatchRequest[] = adSets.map((adSet, index) => ({
      method: 'GET',
      relativeUrl: `${this.apiVersion}/${adSet.id}/insights?fields=${FIELD_SETS.insights}${dateParams}`,
      name: `insights_${index}`,
    }));

    try {
      const batchResults = await this.makeBatchRequest(batchRequests);

      return adSets.map((adSet, index) => {
        const result = batchResults[index];
        let insights: FacebookInsights | undefined;

        if (result.code === 200 && result.data?.data?.[0]) {
          insights = this.mapInsightsData(result.data.data[0]);
        }

        return {
          ...adSet,
          insights,
        };
      });
    } catch (error) {
      console.error('Error fetching ad sets with insights:', error);
      return adSets;
    }
  }

  async getAdSetInsights(
    adSetId: string,
    options?: {
      datePreset?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<FacebookInsights | null> {
    try {
      const dateParams = this.buildDateParams(options);
      const { data } = await this.makeRequest<PaginatedResponse<any>>(
        `${adSetId}/insights?fields=${FIELD_SETS.insights}${dateParams}`
      );

      if (!data.data || data.data.length === 0) {
        return null;
      }

      return this.mapInsightsData(data.data[0]);
    } catch (error) {
      console.error('Error fetching ad set insights:', error);
      return null;
    }
  }

  // ============================================================================
  // Ads with Batch Optimization
  // ============================================================================

  async getAds(
    adSetId: string,
    options?: {
      limit?: number;
      after?: string;
    }
  ): Promise<PaginatedResponse<FacebookAdData>> {
    try {
      let url = `${adSetId}/ads?fields=${FIELD_SETS.ad}`;
      
      if (options?.limit) {
        url += `&limit=${options.limit}`;
      }
      
      if (options?.after) {
        url += `&after=${options.after}`;
      }

      const { data } = await this.makeRequest<PaginatedResponse<any>>(url);

      return {
        data: (data.data || []).map(this.mapAdData),
        paging: data.paging,
        summary: data.summary,
      };
    } catch (error) {
      console.error('Error fetching ads:', error);
      throw this.normalizeError(error);
    }
  }

  async getAdsWithInsights(
    adSetId: string,
    options?: {
      datePreset?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
    }
  ): Promise<Array<FacebookAdData & { insights?: FacebookInsights }>> {
    const adsResponse = await this.getAds(adSetId, { limit: options?.limit });
    const ads = adsResponse.data;

    if (ads.length === 0) {
      return [];
    }

    const dateParams = this.buildDateParams(options);
    const batchRequests: BatchRequest[] = ads.map((ad, index) => ({
      method: 'GET',
      relativeUrl: `${this.apiVersion}/${ad.id}/insights?fields=${FIELD_SETS.insights}${dateParams}`,
      name: `insights_${index}`,
    }));

    try {
      const batchResults = await this.makeBatchRequest(batchRequests);

      return ads.map((ad, index) => {
        const result = batchResults[index];
        let insights: FacebookInsights | undefined;

        if (result.code === 200 && result.data?.data?.[0]) {
          insights = this.mapInsightsData(result.data.data[0]);
        }

        return {
          ...ad,
          insights,
        };
      });
    } catch (error) {
      console.error('Error fetching ads with insights:', error);
      return ads;
    }
  }

  async getAdInsights(
    adId: string,
    options?: {
      datePreset?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<FacebookInsights | null> {
    try {
      const dateParams = this.buildDateParams(options);
      const { data } = await this.makeRequest<PaginatedResponse<any>>(
        `${adId}/insights?fields=${FIELD_SETS.insights}${dateParams}`
      );

      if (!data.data || data.data.length === 0) {
        return null;
      }

      return this.mapInsightsData(data.data[0]);
    } catch (error) {
      console.error('Error fetching ad insights:', error);
      return null;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private formatAccountId(id: string): string {
    return id.startsWith('act_') ? id : `act_${id}`;
  }

  private buildDateParams(options?: {
    datePreset?: string;
    dateFrom?: string;
    dateTo?: string;
  }): string {
    if (!options) {
      return '&date_preset=last_30d';
    }

    if (options.dateFrom && options.dateTo) {
      return `&time_range=${encodeURIComponent(JSON.stringify({
        since: options.dateFrom,
        until: options.dateTo,
      }))}`;
    }

    if (options.datePreset) {
      return `&date_preset=${options.datePreset}`;
    }

    return '&date_preset=last_30d';
  }

  private shouldRetry(errorCode: number | undefined, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries || !errorCode) {
      return false;
    }

    // Retry on rate limiting or temporary issues
    return (
      errorCode === FACEBOOK_ERROR_CODES.API_TOO_MANY_CALLS ||
      errorCode === FACEBOOK_ERROR_CODES.API_USER_TOO_MANY_CALLS ||
      errorCode === FACEBOOK_ERROR_CODES.TEMPORARY_ISSUE ||
      errorCode === FACEBOOK_ERROR_CODES.RATE_LIMIT_REACHED
    );
  }

  private async waitBeforeRetry(attempt: number): Promise<void> {
    // Exponential backoff: 1s, 2s, 4s, etc.
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private isNetworkError(error: Error): boolean {
    return (
      error.name === 'AbortError' ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ConnectTimeoutError') ||
      error.message.includes('fetch failed')
    );
  }

  private createFacebookError(errorData: any, statusCode: number): FacebookError {
    const error = new Error(
      errorData.error?.message || `HTTP ${statusCode}: Request failed`
    ) as FacebookError;
    error.code = errorData.error?.code;
    error.type = errorData.error?.type;
    error.errorSubcode = errorData.error?.error_subcode;
    error.fbtrace_id = errorData.error?.fbtrace_id;
    error.statusCode = statusCode;

    // Check for token expiry
    if (
      error.code === FACEBOOK_ERROR_CODES.INVALID_TOKEN ||
      error.message.includes('Session has expired') ||
      error.message.includes('token is invalid') ||
      error.message.includes('Error validating access token')
    ) {
      error.message = 'FACEBOOK_TOKEN_EXPIRED';
    }

    return error;
  }

  private normalizeError(error: any): Error {
    if (this.isNetworkError(error)) {
      return new Error('Unable to connect to Facebook. Please check your internet connection.');
    }
    return error instanceof Error ? error : new Error('Unknown error');
  }

  // ============================================================================
  // Data Mappers
  // ============================================================================

  private mapAdAccountData(account: any): FacebookAdAccountData {
    return {
      id: account.id,
      name: account.name || 'Unnamed Account',
      accountStatus: account.account_status || 1,
      currency: account.currency || 'USD',
      timezone: account.timezone_name || 'UTC',
      amountSpent: account.amount_spent,
      balance: account.balance,
      spendCap: account.spend_cap,
    };
  }

  private mapCampaignData(campaign: any): FacebookCampaignData {
    return {
      id: campaign.id,
      name: campaign.name || 'Unnamed Campaign',
      status: campaign.status || 'UNKNOWN',
      objective: campaign.objective,
      spendCap: campaign.spend_cap,
      dailyBudget: campaign.daily_budget,
      lifetimeBudget: campaign.lifetime_budget,
      createdTime: campaign.created_time,
      updatedTime: campaign.updated_time,
      effectiveStatus: campaign.effective_status,
    };
  }

  private mapAdSetData(adSet: any): FacebookAdSetData {
    return {
      id: adSet.id,
      name: adSet.name || 'Unnamed Ad Set',
      status: adSet.status || 'UNKNOWN',
      dailyBudget: adSet.daily_budget,
      lifetimeBudget: adSet.lifetime_budget,
      bidAmount: adSet.bid_amount,
      targeting: adSet.targeting,
      effectiveStatus: adSet.effective_status,
      createdTime: adSet.created_time,
      updatedTime: adSet.updated_time,
    };
  }

  private mapAdData(ad: any): FacebookAdData {
    return {
      id: ad.id,
      name: ad.name || 'Unnamed Ad',
      status: ad.status || 'UNKNOWN',
      creative: ad.creative,
      effectiveStatus: ad.effective_status,
      createdTime: ad.created_time,
      updatedTime: ad.updated_time,
    };
  }

  private mapInsightsData(insights: any): FacebookInsights {
    return {
      impressions: insights.impressions,
      clicks: insights.clicks,
      spend: insights.spend,
      reach: insights.reach,
      frequency: insights.frequency,
      ctr: insights.ctr,
      cpc: insights.cpc,
      cpm: insights.cpm,
      cpp: insights.cpp,
      actions: insights.actions,
      actionValues: insights.action_values,
      dateStart: insights.date_start,
      dateStop: insights.date_stop,
    };
  }
}

export async function verifyFacebookConnection(accessToken: string): Promise<boolean> {
  try {
    const api = new FacebookMarketingAPIOptimized(accessToken);
    const validation = await api.validateToken();
    return validation.isValid;
  } catch (error) {
    console.error('Error verifying Facebook connection:', error);
    return false;
  }
}
