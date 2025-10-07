import { FacebookAdsApi, AdAccount, Campaign, AdSet, Ad } from "facebook-nodejs-business-sdk";
import { FacebookErrorHandler, createFacebookError } from "./facebook-errors";
import { CacheManager } from "./cache-manager";
import { FACEBOOK_API_CONFIG, getFieldsString } from "./config/facebook";
import type {
  FacebookAdAccountData,
  FacebookCampaignData,
  FacebookAdSetData,
  FacebookAdData,
  FacebookInsightsData,
  CreateCampaignInput,
  UpdateCampaignInput,
  CreateAdSetInput,
  UpdateAdSetInput,
  CreateAdInput,
  UpdateAdInput,
  InsightsOptions,
  QueryOptions,
} from "@/types/facebook-api";

// ============================================================================
// TYPES
// ============================================================================

export interface FacebookSDKClientConfig {
  accessToken: string;
  apiVersion?: string;
  cacheManager?: CacheManager;
  userId?: string;
}

export interface BatchRequest {
  method: "GET" | "POST" | "DELETE" | "PUT";
  relativeUrl: string;
  body?: Record<string, any>;
}

export interface BatchResponse {
  code: number;
  headers: Record<string, string>;
  body: string;
}

// ============================================================================
// FACEBOOK SDK CLIENT
// ============================================================================

/**
 * FacebookSDKClient - Type-safe wrapper cho Facebook Business SDK
 * 
 * Provides comprehensive integration với Facebook Marketing API v23.0,
 * bao gồm error handling, caching, và retry logic.
 * 
 * @example
 * ```typescript
 * const client = new FacebookSDKClient({
 *   accessToken: 'your_access_token',
 *   apiVersion: 'v23.0',
 *   cacheManager: new CacheManager(),
 *   userId: 'user_123'
 * });
 * 
 * // Fetch campaigns
 * const campaigns = await client.getCampaigns('act_123456');
 * 
 * // Create campaign
 * const newCampaign = await client.createCampaign('act_123456', {
 *   name: 'My Campaign',
 *   objective: 'LINK_CLICKS',
 *   status: 'PAUSED'
 * });
 * ```
 * 
 * @see {@link https://developers.facebook.com/docs/marketing-api Facebook Marketing API Documentation}
 */
export class FacebookSDKClient {
  private accessToken: string;
  private apiVersion: string;
  private errorHandler: FacebookErrorHandler;
  private cacheManager?: CacheManager;
  private userId?: string;
  private isInitialized: boolean = false;

  constructor(config: FacebookSDKClientConfig) {
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || FACEBOOK_API_CONFIG.apiVersion;
    this.errorHandler = new FacebookErrorHandler();
    this.cacheManager = config.cacheManager;
    this.userId = config.userId;

    // Initialize Facebook SDK
    this.initializeSDK();
  }

  /**
   * Initialize Facebook SDK với access token
   * 
   * @private
   * @throws {FacebookAPIError} Nếu initialization fails
   */
  private initializeSDK(): void {
    try {
      FacebookAdsApi.init(this.accessToken);
      this.isInitialized = true;
    } catch (error) {
      throw createFacebookError(error, {
        endpoint: "SDK Initialization",
        userId: this.userId,
      });
    }
  }

  /**
   * Validate access token bằng cách gọi Facebook Graph API
   * 
   * @returns {Promise<boolean>} True nếu token valid
   * @throws {FacebookAPIError} Nếu token invalid hoặc expired
   * 
   * @example
   * ```typescript
   * const isValid = await client.validateToken();
   * if (!isValid) {
   *   // Trigger re-authentication
   * }
   * ```
   */
  async validateToken(): Promise<boolean> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/me?access_token=${this.accessToken}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: "Token Validation",
            userId: this.userId,
          });
        }

        return true;
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: "Token Validation",
          userId: this.userId,
        });
      }
    });
  }

  // ============================================================================
  // AD ACCOUNT OPERATIONS
  // ============================================================================

  /**
   * Fetch thông tin chi tiết của một ad account
   * 
   * Tự động check cache trước khi gọi API. Kết quả không được cache
   * vì method này fetch single account.
   * 
   * @param {string} accountId - Facebook Ad Account ID (format: act_123456)
   * @returns {Promise<FacebookAdAccountData>} Ad account data
   * @throws {FacebookAPIError} Nếu account không tồn tại hoặc không có permission
   * 
   * @example
   * ```typescript
   * const account = await client.getAdAccount('act_123456');
   * console.log(account.name, account.currency);
   * ```
   */
  async getAdAccount(accountId: string): Promise<FacebookAdAccountData> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        // Check cache first
        if (this.cacheManager && this.userId) {
          const cached = this.cacheManager.getAdAccounts(this.userId);
          if (cached) {
            const account = cached.find((acc) => acc.id === accountId);
            if (account) return account;
          }
        }

        const fields = getFieldsString("adAccount");
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${accountId}?fields=${fields}&access_token=${this.accessToken}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `getAdAccount(${accountId})`,
            userId: this.userId,
          });
        }

        const data = await response.json();
        return data as FacebookAdAccountData;
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `getAdAccount(${accountId})`,
          userId: this.userId,
        });
      }
    });
  }

  /**
   * Fetch tất cả ad accounts cho user hoặc business
   * 
   * Kết quả được cache với TTL 30 phút. Nếu businessId được cung cấp,
   * sẽ fetch ad accounts của business đó.
   * 
   * @param {string} [businessId] - Optional Business ID để fetch business ad accounts
   * @returns {Promise<FacebookAdAccountData[]>} Array of ad accounts
   * @throws {FacebookAPIError} Nếu không có permission hoặc business không tồn tại
   * 
   * @example
   * ```typescript
   * // Get user's ad accounts
   * const accounts = await client.getAdAccounts();
   * 
   * // Get business ad accounts
   * const businessAccounts = await client.getAdAccounts('123456789');
   * ```
   */
  async getAdAccounts(businessId?: string): Promise<FacebookAdAccountData[]> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        // Check cache first
        if (this.cacheManager && this.userId) {
          const cached = this.cacheManager.getAdAccounts(this.userId);
          if (cached) return cached;
        }

        const fields = getFieldsString("adAccount");
        const endpoint = businessId
          ? `${businessId}/owned_ad_accounts`
          : "me/adaccounts";

        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${endpoint}?fields=${fields}&access_token=${this.accessToken}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: "getAdAccounts",
            userId: this.userId,
            params: { businessId },
          });
        }

        const result = await response.json();
        const accounts = result.data as FacebookAdAccountData[];

        // Cache the results
        if (this.cacheManager && this.userId) {
          this.cacheManager.setAdAccounts(this.userId, accounts);
        }

        return accounts;
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: "getAdAccounts",
          userId: this.userId,
          params: { businessId },
        });
      }
    });
  }

  // ============================================================================
  // CAMPAIGN OPERATIONS
  // ============================================================================

  /**
   * Fetch campaigns cho một ad account
   * 
   * Kết quả được cache với TTL 5 phút (trừ khi có filtering).
   * Supports pagination, filtering, và custom field selection.
   * 
   * @param {string} accountId - Facebook Ad Account ID (format: act_123456)
   * @param {QueryOptions} [options] - Query options
   * @param {string[]} [options.fields] - Custom fields để fetch
   * @param {number} [options.limit] - Số lượng results per page
   * @param {string} [options.after] - Cursor cho pagination
   * @param {any} [options.filtering] - Facebook filtering syntax
   * @returns {Promise<FacebookCampaignData[]>} Array of campaigns
   * @throws {FacebookAPIError} Nếu account không tồn tại hoặc không có permission
   * 
   * @example
   * ```typescript
   * // Get all campaigns
   * const campaigns = await client.getCampaigns('act_123456');
   * 
   * // Get active campaigns only
   * const activeCampaigns = await client.getCampaigns('act_123456', {
   *   filtering: [{ field: 'status', operator: 'EQUAL', value: 'ACTIVE' }]
   * });
   * 
   * // Get campaigns with custom fields
   * const campaigns = await client.getCampaigns('act_123456', {
   *   fields: ['id', 'name', 'status', 'daily_budget']
   * });
   * ```
   */
  async getCampaigns(
    accountId: string,
    options?: QueryOptions
  ): Promise<FacebookCampaignData[]> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        // Check cache first
        if (this.cacheManager && this.userId && !options?.filtering) {
          const cached = this.cacheManager.getCampaigns(this.userId, accountId);
          if (cached) return cached;
        }

        const fields = options?.fields?.join(",") || getFieldsString("campaign");
        let url = `https://graph.facebook.com/${this.apiVersion}/${accountId}/campaigns?fields=${fields}&access_token=${this.accessToken}`;

        if (options?.limit) {
          url += `&limit=${options.limit}`;
        }

        if (options?.after) {
          url += `&after=${options.after}`;
        }

        if (options?.filtering) {
          url += `&filtering=${JSON.stringify(options.filtering)}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `getCampaigns(${accountId})`,
            userId: this.userId,
            params: options,
          });
        }

        const result = await response.json();
        const campaigns = result.data as FacebookCampaignData[];

        // Cache the results if no filtering
        if (this.cacheManager && this.userId && !options?.filtering) {
          this.cacheManager.setCampaigns(this.userId, accountId, campaigns);
        }

        return campaigns;
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `getCampaigns(${accountId})`,
          userId: this.userId,
          params: options,
        });
      }
    });
  }

  /**
   * Fetch thông tin chi tiết của một campaign
   * 
   * @param {string} campaignId - Facebook Campaign ID
   * @param {string[]} [fields] - Custom fields để fetch (default: all standard fields)
   * @returns {Promise<FacebookCampaignData>} Campaign data
   * @throws {FacebookAPIError} Nếu campaign không tồn tại hoặc không có permission
   * 
   * @example
   * ```typescript
   * const campaign = await client.getCampaign('123456789');
   * console.log(campaign.name, campaign.status);
   * ```
   */
  async getCampaign(
    campaignId: string,
    fields?: string[]
  ): Promise<FacebookCampaignData> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const fieldList = fields?.join(",") || getFieldsString("campaign");
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${campaignId}?fields=${fieldList}&access_token=${this.accessToken}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `getCampaign(${campaignId})`,
            userId: this.userId,
          });
        }

        const data = await response.json();
        return data as FacebookCampaignData;
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `getCampaign(${campaignId})`,
          userId: this.userId,
        });
      }
    });
  }

  /**
   * Tạo campaign mới
   * 
   * Tự động invalidate cache sau khi tạo thành công.
   * Campaign mới sẽ được fetch lại để có đầy đủ thông tin.
   * 
   * @param {string} accountId - Facebook Ad Account ID (format: act_123456)
   * @param {CreateCampaignInput} data - Campaign data
   * @param {string} data.name - Campaign name
   * @param {string} data.objective - Campaign objective (e.g., 'LINK_CLICKS')
   * @param {string} data.status - Campaign status ('ACTIVE' | 'PAUSED')
   * @param {string} [data.daily_budget] - Daily budget in cents
   * @param {string} [data.lifetime_budget] - Lifetime budget in cents
   * @returns {Promise<FacebookCampaignData>} Created campaign data
   * @throws {FacebookAPIError} Nếu validation fails hoặc không có permission
   * 
   * @example
   * ```typescript
   * const campaign = await client.createCampaign('act_123456', {
   *   name: 'Summer Sale Campaign',
   *   objective: 'LINK_CLICKS',
   *   status: 'PAUSED',
   *   daily_budget: '5000' // $50.00
   * });
   * ```
   */
  async createCampaign(
    accountId: string,
    data: CreateCampaignInput
  ): Promise<FacebookCampaignData> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${accountId}/campaigns?access_token=${this.accessToken}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `createCampaign(${accountId})`,
            userId: this.userId,
            params: data,
          });
        }

        const result = await response.json();

        // Invalidate cache
        if (this.cacheManager && this.userId) {
          this.cacheManager.invalidateCampaigns(this.userId, accountId);
        }

        // Fetch full campaign data
        return this.getCampaign(result.id);
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `createCampaign(${accountId})`,
          userId: this.userId,
          params: data,
        });
      }
    });
  }

  /**
   * Update campaign
   * 
   * Tự động invalidate cache sau khi update thành công.
   * Campaign được fetch lại để có thông tin mới nhất.
   * 
   * @param {string} campaignId - Facebook Campaign ID
   * @param {UpdateCampaignInput} updates - Fields to update
   * @param {string} [updates.name] - New campaign name
   * @param {string} [updates.status] - New status
   * @param {string} [updates.daily_budget] - New daily budget
   * @returns {Promise<FacebookCampaignData>} Updated campaign data
   * @throws {FacebookAPIError} Nếu validation fails hoặc không có permission
   * 
   * @example
   * ```typescript
   * // Update campaign status
   * const campaign = await client.updateCampaign('123456789', {
   *   status: 'ACTIVE'
   * });
   * 
   * // Update multiple fields
   * const campaign = await client.updateCampaign('123456789', {
   *   name: 'Updated Campaign Name',
   *   daily_budget: '10000'
   * });
   * ```
   */
  async updateCampaign(
    campaignId: string,
    updates: UpdateCampaignInput
  ): Promise<FacebookCampaignData> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${campaignId}?access_token=${this.accessToken}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `updateCampaign(${campaignId})`,
            userId: this.userId,
            params: updates,
          });
        }

        // Invalidate cache
        if (this.cacheManager && this.userId) {
          this.cacheManager.invalidateCampaigns(this.userId);
        }

        // Fetch updated campaign data
        return this.getCampaign(campaignId);
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `updateCampaign(${campaignId})`,
          userId: this.userId,
          params: updates,
        });
      }
    });
  }

  /**
   * Delete campaign
   * 
   * Tự động invalidate cache sau khi delete thành công.
   * Note: Facebook thực hiện soft delete, campaign vẫn có thể restore.
   * 
   * @param {string} campaignId - Facebook Campaign ID
   * @returns {Promise<void>}
   * @throws {FacebookAPIError} Nếu campaign không tồn tại hoặc không có permission
   * 
   * @example
   * ```typescript
   * await client.deleteCampaign('123456789');
   * ```
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${campaignId}?access_token=${this.accessToken}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `deleteCampaign(${campaignId})`,
            userId: this.userId,
          });
        }

        // Invalidate cache
        if (this.cacheManager && this.userId) {
          this.cacheManager.invalidateCampaigns(this.userId);
        }
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `deleteCampaign(${campaignId})`,
          userId: this.userId,
        });
      }
    });
  }

  // ============================================================================
  // ADSET OPERATIONS
  // ============================================================================

  /**
   * Get ad sets for a campaign
   */
  async getAdSets(
    campaignId: string,
    options?: QueryOptions
  ): Promise<FacebookAdSetData[]> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        // Check cache first
        if (this.cacheManager && this.userId && !options?.filtering) {
          const cached = this.cacheManager.getAdSets(this.userId, campaignId);
          if (cached) return cached;
        }

        const fields = options?.fields?.join(",") || getFieldsString("adSet");
        let url = `https://graph.facebook.com/${this.apiVersion}/${campaignId}/adsets?fields=${fields}&access_token=${this.accessToken}`;

        if (options?.limit) {
          url += `&limit=${options.limit}`;
        }

        if (options?.after) {
          url += `&after=${options.after}`;
        }

        if (options?.filtering) {
          url += `&filtering=${JSON.stringify(options.filtering)}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `getAdSets(${campaignId})`,
            userId: this.userId,
            params: options,
          });
        }

        const result = await response.json();
        const adSets = result.data as FacebookAdSetData[];

        // Cache the results if no filtering
        if (this.cacheManager && this.userId && !options?.filtering) {
          this.cacheManager.setAdSets(this.userId, campaignId, adSets);
        }

        return adSets;
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `getAdSets(${campaignId})`,
          userId: this.userId,
          params: options,
        });
      }
    });
  }

  /**
   * Get single ad set
   */
  async getAdSet(adSetId: string, fields?: string[]): Promise<FacebookAdSetData> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const fieldList = fields?.join(",") || getFieldsString("adSet");
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${adSetId}?fields=${fieldList}&access_token=${this.accessToken}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `getAdSet(${adSetId})`,
            userId: this.userId,
          });
        }

        const data = await response.json();
        return data as FacebookAdSetData;
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `getAdSet(${adSetId})`,
          userId: this.userId,
        });
      }
    });
  }

  /**
   * Create ad set
   */
  async createAdSet(
    campaignId: string,
    data: CreateAdSetInput
  ): Promise<FacebookAdSetData> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${campaignId}/adsets?access_token=${this.accessToken}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `createAdSet(${campaignId})`,
            userId: this.userId,
            params: data,
          });
        }

        const result = await response.json();

        // Invalidate cache
        if (this.cacheManager && this.userId) {
          this.cacheManager.invalidateAdSets(this.userId, campaignId);
        }

        // Fetch full ad set data
        return this.getAdSet(result.id);
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `createAdSet(${campaignId})`,
          userId: this.userId,
          params: data,
        });
      }
    });
  }

  /**
   * Update ad set
   */
  async updateAdSet(
    adSetId: string,
    updates: UpdateAdSetInput
  ): Promise<FacebookAdSetData> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${adSetId}?access_token=${this.accessToken}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `updateAdSet(${adSetId})`,
            userId: this.userId,
            params: updates,
          });
        }

        // Invalidate cache
        if (this.cacheManager && this.userId) {
          this.cacheManager.invalidateAdSets(this.userId);
        }

        // Fetch updated ad set data
        return this.getAdSet(adSetId);
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `updateAdSet(${adSetId})`,
          userId: this.userId,
          params: updates,
        });
      }
    });
  }

  /**
   * Delete ad set
   */
  async deleteAdSet(adSetId: string): Promise<void> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${adSetId}?access_token=${this.accessToken}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `deleteAdSet(${adSetId})`,
            userId: this.userId,
          });
        }

        // Invalidate cache
        if (this.cacheManager && this.userId) {
          this.cacheManager.invalidateAdSets(this.userId);
        }
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `deleteAdSet(${adSetId})`,
          userId: this.userId,
        });
      }
    });
  }

  // ============================================================================
  // AD OPERATIONS
  // ============================================================================

  /**
   * Get ads for an ad set
   */
  async getAds(adSetId: string, options?: QueryOptions): Promise<FacebookAdData[]> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        // Check cache first
        if (this.cacheManager && this.userId && !options?.filtering) {
          const cached = this.cacheManager.getAds(this.userId, adSetId);
          if (cached) return cached;
        }

        const fields = options?.fields?.join(",") || getFieldsString("ad");
        let url = `https://graph.facebook.com/${this.apiVersion}/${adSetId}/ads?fields=${fields}&access_token=${this.accessToken}`;

        if (options?.limit) {
          url += `&limit=${options.limit}`;
        }

        if (options?.after) {
          url += `&after=${options.after}`;
        }

        if (options?.filtering) {
          url += `&filtering=${JSON.stringify(options.filtering)}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `getAds(${adSetId})`,
            userId: this.userId,
            params: options,
          });
        }

        const result = await response.json();
        const ads = result.data as FacebookAdData[];

        // Cache the results if no filtering
        if (this.cacheManager && this.userId && !options?.filtering) {
          this.cacheManager.setAds(this.userId, adSetId, ads);
        }

        return ads;
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `getAds(${adSetId})`,
          userId: this.userId,
          params: options,
        });
      }
    });
  }

  /**
   * Get single ad
   */
  async getAd(adId: string, fields?: string[]): Promise<FacebookAdData> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const fieldList = fields?.join(",") || getFieldsString("ad");
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${adId}?fields=${fieldList}&access_token=${this.accessToken}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `getAd(${adId})`,
            userId: this.userId,
          });
        }

        const data = await response.json();
        return data as FacebookAdData;
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `getAd(${adId})`,
          userId: this.userId,
        });
      }
    });
  }

  /**
   * Create ad
   */
  async createAd(adSetId: string, data: CreateAdInput): Promise<FacebookAdData> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${adSetId}/ads?access_token=${this.accessToken}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `createAd(${adSetId})`,
            userId: this.userId,
            params: data,
          });
        }

        const result = await response.json();

        // Invalidate cache
        if (this.cacheManager && this.userId) {
          this.cacheManager.invalidateAds(this.userId, adSetId);
        }

        // Fetch full ad data
        return this.getAd(result.id);
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `createAd(${adSetId})`,
          userId: this.userId,
          params: data,
        });
      }
    });
  }

  /**
   * Update ad
   */
  async updateAd(adId: string, updates: UpdateAdInput): Promise<FacebookAdData> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${adId}?access_token=${this.accessToken}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `updateAd(${adId})`,
            userId: this.userId,
            params: updates,
          });
        }

        // Invalidate cache
        if (this.cacheManager && this.userId) {
          this.cacheManager.invalidateAds(this.userId);
        }

        // Fetch updated ad data
        return this.getAd(adId);
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `updateAd(${adId})`,
          userId: this.userId,
          params: updates,
        });
      }
    });
  }

  /**
   * Delete ad
   */
  async deleteAd(adId: string): Promise<void> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}/${adId}?access_token=${this.accessToken}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `deleteAd(${adId})`,
            userId: this.userId,
          });
        }

        // Invalidate cache
        if (this.cacheManager && this.userId) {
          this.cacheManager.invalidateAds(this.userId);
        }
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `deleteAd(${adId})`,
          userId: this.userId,
        });
      }
    });
  }

  // ============================================================================
  // INSIGHTS OPERATIONS
  // ============================================================================

  /**
   * Fetch insights (metrics) cho một entity (campaign, ad set, hoặc ad)
   * 
   * Kết quả được cache với TTL 10 phút. Cache key bao gồm date range
   * để tránh conflict giữa các time periods khác nhau.
   * 
   * @param {string} entityId - Facebook entity ID (campaign, ad set, hoặc ad)
   * @param {InsightsOptions} options - Insights options
   * @param {string} [options.date_preset] - Preset date range (e.g., 'last_7d', 'last_30d')
   * @param {Object} [options.time_range] - Custom date range
   * @param {string} options.time_range.since - Start date (YYYY-MM-DD)
   * @param {string} options.time_range.until - End date (YYYY-MM-DD)
   * @param {string} [options.level] - Aggregation level ('account', 'campaign', 'adset', 'ad')
   * @param {string[]} [options.breakdowns] - Breakdowns (e.g., ['age', 'gender'])
   * @param {string[]} [options.action_breakdowns] - Action breakdowns
   * @param {string[]} [options.fields] - Custom fields
   * @returns {Promise<FacebookInsightsData>} Insights data
   * @throws {FacebookAPIError} Nếu entity không tồn tại hoặc date range invalid
   * 
   * @example
   * ```typescript
   * // Get last 7 days insights
   * const insights = await client.getInsights('123456789', {
   *   date_preset: 'last_7d'
   * });
   * 
   * // Get custom date range insights
   * const insights = await client.getInsights('123456789', {
   *   time_range: {
   *     since: '2024-01-01',
   *     until: '2024-01-31'
   *   }
   * });
   * 
   * // Get insights with breakdowns
   * const insights = await client.getInsights('123456789', {
   *   date_preset: 'last_30d',
   *   breakdowns: ['age', 'gender']
   * });
   * ```
   */
  async getInsights(
    entityId: string,
    options: InsightsOptions
  ): Promise<FacebookInsightsData> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        // Generate cache key based on date range
        const dateRangeKey = options.time_range
          ? `${options.time_range.since}_${options.time_range.until}`
          : options.date_preset || "default";

        // Check cache first
        if (this.cacheManager && this.userId) {
          const cached = this.cacheManager.getInsights(
            this.userId,
            entityId,
            dateRangeKey
          );
          if (cached) return cached;
        }

        const fields = options.fields?.join(",") || getFieldsString("insights");
        let url = `https://graph.facebook.com/${this.apiVersion}/${entityId}/insights?fields=${fields}&access_token=${this.accessToken}`;

        if (options.date_preset) {
          url += `&date_preset=${options.date_preset}`;
        }

        if (options.time_range) {
          url += `&time_range=${JSON.stringify(options.time_range)}`;
        }

        if (options.level) {
          url += `&level=${options.level}`;
        }

        if (options.breakdowns) {
          url += `&breakdowns=${options.breakdowns.join(",")}`;
        }

        if (options.action_breakdowns) {
          url += `&action_breakdowns=${options.action_breakdowns.join(",")}`;
        }

        if (options.filtering) {
          url += `&filtering=${JSON.stringify(options.filtering)}`;
        }

        if (options.limit) {
          url += `&limit=${options.limit}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: `getInsights(${entityId})`,
            userId: this.userId,
            params: options,
          });
        }

        const result = await response.json();
        const insights = result.data?.[0] as FacebookInsightsData;

        // Cache the results
        if (this.cacheManager && this.userId && insights) {
          this.cacheManager.setInsights(
            this.userId,
            entityId,
            insights,
            dateRangeKey
          );
        }

        return insights;
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: `getInsights(${entityId})`,
          userId: this.userId,
          params: options,
        });
      }
    });
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Execute batch request với Facebook Graph API
   * 
   * Cho phép gửi tối đa 50 requests trong một batch để optimize API calls.
   * Mỗi request trong batch có thể có method và endpoint riêng.
   * 
   * @param {BatchRequest[]} requests - Array of batch requests (max 50)
   * @param {string} requests[].method - HTTP method ('GET', 'POST', 'DELETE', 'PUT')
   * @param {string} requests[].relativeUrl - Relative URL (e.g., 'act_123/campaigns')
   * @param {Object} [requests[].body] - Request body cho POST/PUT
   * @returns {Promise<BatchResponse[]>} Array of responses tương ứng với requests
   * @throws {FacebookAPIError} Nếu batch request fails
   * 
   * @example
   * ```typescript
   * const responses = await client.batchRequest([
   *   {
   *     method: 'GET',
   *     relativeUrl: 'act_123/campaigns?fields=id,name'
   *   },
   *   {
   *     method: 'GET',
   *     relativeUrl: 'act_123/adsets?fields=id,name'
   *   }
   * ]);
   * 
   * responses.forEach((response, index) => {
   *   if (response.code === 200) {
   *     const data = JSON.parse(response.body);
   *     console.log('Request', index, 'succeeded:', data);
   *   }
   * });
   * ```
   */
  async batchRequest(requests: BatchRequest[]): Promise<BatchResponse[]> {
    return this.errorHandler.handleWithRetry(async () => {
      try {
        const batch = requests.map((req) => ({
          method: req.method,
          relative_url: req.relativeUrl,
          body: req.body ? JSON.stringify(req.body) : undefined,
        }));

        const response = await fetch(
          `https://graph.facebook.com/${this.apiVersion}?access_token=${this.accessToken}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ batch }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw createFacebookError(error, {
            endpoint: "batchRequest",
            userId: this.userId,
            params: { requestCount: requests.length },
          });
        }

        const results = await response.json();
        return results.map((result: any) => ({
          code: result.code,
          headers: result.headers || {},
          body: result.body || "",
        }));
      } catch (error) {
        throw createFacebookError(error, {
          endpoint: "batchRequest",
          userId: this.userId,
          params: { requestCount: requests.length },
        });
      }
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get current access token
   */
  getAccessToken(): string {
    return this.accessToken;
  }

  /**
   * Update access token
   */
  updateAccessToken(newToken: string): void {
    this.accessToken = newToken;
    this.initializeSDK();
  }

  /**
   * Check if SDK is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Set cache manager
   */
  setCacheManager(cacheManager: CacheManager): void {
    this.cacheManager = cacheManager;
  }

  /**
   * Set user ID for cache keys
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }
}
