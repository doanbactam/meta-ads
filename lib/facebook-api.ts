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
        `https://graph.facebook.com/v23.0/debug_token?input_token=${this.accessToken}&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        return {
          isValid: false,
          error: 'Failed to validate token',
        };
      }

      const data = await response.json();
      const tokenData = data.data;

      return {
        isValid: tokenData.is_valid || false,
        appId: tokenData.app_id,
        userId: tokenData.user_id,
        expiresAt: tokenData.expires_at,
        scopes: tokenData.scopes || [],
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getUserAdAccounts(): Promise<FacebookAdAccountData[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch ad accounts');
      }

      const data = await response.json();

      return (data.data || []).map((account: any) => ({
        id: account.id,
        name: account.name,
        accountStatus: account.account_status,
        currency: account.currency,
        timezone: account.timezone_name || 'UTC',
      }));
    } catch (error) {
      console.error('Error fetching ad accounts:', error);
      throw error;
    }
  }

  async getCampaigns(adAccountId: string): Promise<FacebookCampaignData[]> {
    try {
      const formattedAccountId = adAccountId.startsWith('act_')
        ? adAccountId
        : `act_${adAccountId}`;

      const response = await fetch(
        `https://graph.facebook.com/v23.0/${formattedAccountId}/campaigns?fields=id,name,status,objective,spend_cap,daily_budget,lifetime_budget&access_token=${this.accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();

      return (data.data || []).map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        spendCap: campaign.spend_cap,
        dailyBudget: campaign.daily_budget,
        lifetimeBudget: campaign.lifetime_budget,
      }));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
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
