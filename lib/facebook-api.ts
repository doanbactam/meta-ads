import { FacebookAdsApi, AdAccount, Campaign, AdSet, Ad } from 'facebook-nodejs-business-sdk';

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

export class FacebookMarketingAPI {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    FacebookAdsApi.init(accessToken);
  }

  async validateToken(): Promise<FacebookTokenValidation> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v23.0/debug_token?input_token=${this.accessToken}&access_token=${this.accessToken}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

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
      console.error('Token validation error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during validation',
      };
    }
  }

  async getUserAdAccounts(): Promise<FacebookAdAccountData[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${this.accessToken}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: Failed to fetch ad accounts`;
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
      throw error instanceof Error ? error : new Error('Unknown error fetching ad accounts');
    }
  }

  async getCampaigns(adAccountId: string): Promise<FacebookCampaignData[]> {
    try {
      const formattedAccountId = adAccountId.startsWith('act_')
        ? adAccountId
        : `act_${adAccountId}`;

      const response = await fetch(
        `https://graph.facebook.com/v23.0/${formattedAccountId}/campaigns?fields=id,name,status,objective,spend_cap,daily_budget,lifetime_budget&access_token=${this.accessToken}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}: Failed to fetch campaigns`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Failed to fetch campaigns');
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
      throw error instanceof Error ? error : new Error('Unknown error fetching campaigns');
    }
  }

  async getCampaignInsights(
    campaignId: string,
    datePreset: string = 'last_30d'
  ): Promise<FacebookCampaignInsights | null> {
    try {
      const fields = [
        'impressions',
        'clicks',
        'spend',
        'reach',
        'frequency',
        'ctr',
        'cpc',
        'cpm',
      ];

      const response = await fetch(
        `https://graph.facebook.com/v23.0/${campaignId}/insights?fields=${fields.join(',')}&date_preset=${datePreset}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch campaign insights');
      }

      const data = await response.json();

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
      console.error('Error fetching campaign insights:', error);
      return null;
    }
  }

  async getAdSets(campaignId: string) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v23.0/${campaignId}/adsets?fields=id,name,status,daily_budget,lifetime_budget,bid_amount,targeting&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch ad sets');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching ad sets:', error);
      throw error;
    }
  }

  async getAds(adSetId: string) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v23.0/${adSetId}/ads?fields=id,name,status,creative&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch ads');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching ads:', error);
      throw error;
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
