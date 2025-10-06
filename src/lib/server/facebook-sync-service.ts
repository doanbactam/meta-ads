import { prisma } from '@/lib/server/prisma';
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';
import { mapFacebookStatus, parseDate } from '@/lib/shared/formatters';
import type { CampaignStatus, AdSetStatus, CreativeStatus } from '@prisma/client';

/**
 * Facebook Sync Service
 * Syncs data from Facebook Marketing API to local database
 * Used for caching and reducing API calls
 */

interface SyncOptions {
  dateFrom?: string;
  dateTo?: string;
  force?: boolean; // Force sync even if recently synced
}

interface SyncResult {
  success: boolean;
  campaigns: number;
  adSets: number;
  ads: number;
  errors: string[];
}

const SYNC_INTERVAL = 10 * 60 * 1000; // 10 minutes

export class FacebookSyncService {
  private api: FacebookMarketingAPI;
  private adAccountId: string;
  private adAccountDbId: string;

  constructor(accessToken: string, adAccountId: string, adAccountDbId: string) {
    this.api = new FacebookMarketingAPI(accessToken);
    this.adAccountId = adAccountId;
    this.adAccountDbId = adAccountDbId;
  }

  /**
   * Check if sync is needed based on last sync time
   */
  private async needsSync(force: boolean = false): Promise<boolean> {
    if (force) return true;

    const adAccount = await prisma.adAccount.findUnique({
      where: { id: this.adAccountDbId },
      select: { lastSyncedAt: true },
    });

    if (!adAccount?.lastSyncedAt) return true;

    const timeSinceLastSync = Date.now() - adAccount.lastSyncedAt.getTime();
    return timeSinceLastSync > SYNC_INTERVAL;
  }

  /**
   * Full sync: campaigns, ad sets, and ads
   */
  async syncAll(options: SyncOptions = {}): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      campaigns: 0,
      adSets: 0,
      ads: 0,
      errors: [],
    };

    try {
      // Check if sync is needed
      if (!(await this.needsSync(options.force))) {
        console.log(`Ad account ${this.adAccountId} was recently synced, skipping...`);
        return { ...result, success: true };
      }

      // Update sync status
      await prisma.adAccount.update({
        where: { id: this.adAccountDbId },
        data: { syncStatus: 'SYNCING', syncError: null },
      });

      // Sync campaigns first
      const campaignsResult = await this.syncCampaigns(options);
      result.campaigns = campaignsResult.synced;
      result.errors.push(...campaignsResult.errors);

      // Sync ad sets
      const adSetsResult = await this.syncAdSets(options);
      result.adSets = adSetsResult.synced;
      result.errors.push(...adSetsResult.errors);

      // Sync ads
      const adsResult = await this.syncAds(options);
      result.ads = adsResult.synced;
      result.errors.push(...adsResult.errors);

      // Update sync status
      await prisma.adAccount.update({
        where: { id: this.adAccountDbId },
        data: {
          lastSyncedAt: new Date(),
          syncStatus: result.errors.length > 0 ? 'ERROR' : 'IDLE',
          syncError: result.errors.length > 0 ? result.errors.join('; ') : null,
        },
      });

      result.success = true;
      console.log(
        `Sync completed for ${this.adAccountId}: ${result.campaigns} campaigns, ${result.adSets} ad sets, ${result.ads} ads`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      result.errors.push(errorMessage);

      await prisma.adAccount.update({
        where: { id: this.adAccountDbId },
        data: { syncStatus: 'ERROR', syncError: errorMessage },
      });

      console.error(`Sync failed for ${this.adAccountId}:`, error);
    }

    return result;
  }

  /**
   * Sync campaigns from Facebook to database
   */
  private async syncCampaigns(options: SyncOptions): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const facebookCampaigns = await this.api.getCampaigns(this.adAccountId);

      for (const fbCampaign of facebookCampaigns) {
        try {
          // Get insights for the campaign
          const insights = await this.api
            .getCampaignInsights(fbCampaign.id, {
              dateFrom: options.dateFrom,
              dateTo: options.dateTo,
            })
            .catch(() => null);

          // Upsert campaign
          // Note: Facebook API returns budget and spend in cents, so we divide by 100 to get dollars
          const dateStart = parseDate(options.dateFrom);
          const dateEnd = parseDate(options.dateTo);
          
          await prisma.campaign.upsert({
            where: { facebookCampaignId: fbCampaign.id },
            create: {
              adAccountId: this.adAccountDbId,
              facebookCampaignId: fbCampaign.id,
              name: fbCampaign.name,
              status: mapFacebookStatus(fbCampaign.status, 'campaign') as CampaignStatus,
              budget: parseFloat(fbCampaign.dailyBudget || fbCampaign.lifetimeBudget || '0') / 100,
              spent: parseFloat(insights?.spend || '0') / 100,
              impressions: parseInt(insights?.impressions || '0'),
              clicks: parseInt(insights?.clicks || '0'),
              ctr: parseFloat(insights?.ctr || '0'),
              conversions: 0, // Facebook needs conversion tracking setup
              costPerConversion: 0,
              dateStart: dateStart as any,
              dateEnd: dateEnd as any,
              schedule: 'continuous',
              lastSyncedAt: new Date(),
            },
            update: {
              name: fbCampaign.name,
              status: mapFacebookStatus(fbCampaign.status, 'campaign') as CampaignStatus,
              budget: parseFloat(fbCampaign.dailyBudget || fbCampaign.lifetimeBudget || '0') / 100,
              spent: parseFloat(insights?.spend || '0') / 100,
              impressions: parseInt(insights?.impressions || '0'),
              clicks: parseInt(insights?.clicks || '0'),
              ctr: parseFloat(insights?.ctr || '0'),
              lastSyncedAt: new Date(),
            },
          });

          synced++;
        } catch (error) {
          const msg = `Failed to sync campaign ${fbCampaign.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(msg);
          console.warn(msg);
        }
      }
    } catch (error) {
      const msg = `Failed to fetch campaigns: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(msg);
      console.error(msg);
    }

    return { synced, errors };
  }

  /**
   * Sync ad sets from Facebook to database
   */
  private async syncAdSets(options: SyncOptions): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      // Get all campaigns from database
      const campaigns = await prisma.campaign.findMany({
        where: { adAccountId: this.adAccountDbId },
        select: { id: true, facebookCampaignId: true },
      });

      for (const campaign of campaigns) {
        if (!campaign.facebookCampaignId) continue;

        try {
          const facebookAdSets = await this.api.getAdSets(campaign.facebookCampaignId);

          for (const fbAdSet of facebookAdSets) {
            try {
              const insights = await this.api
                .getAdSetInsights(fbAdSet.id, {
                  dateFrom: options.dateFrom,
                  dateTo: options.dateTo,
                })
                .catch(() => null);

              // Note: Facebook API returns budget and spend in cents, so we divide by 100 to get dollars
              const dateStart = parseDate(options.dateFrom);
              const dateEnd = parseDate(options.dateTo);
              
              await prisma.adGroup.upsert({
                where: { facebookAdSetId: fbAdSet.id },
                create: {
                  campaignId: campaign.id,
                  facebookAdSetId: fbAdSet.id,
                  name: fbAdSet.name,
                  status: mapFacebookStatus(fbAdSet.status, 'adset') as AdSetStatus,
                  budget: parseFloat(fbAdSet.daily_budget || fbAdSet.lifetime_budget || '0') / 100,
                  spent: parseFloat(insights?.spend || '0') / 100,
                  impressions: parseInt(insights?.impressions || '0'),
                  clicks: parseInt(insights?.clicks || '0'),
                  ctr: parseFloat(insights?.ctr || '0'),
                  cpc: parseFloat(insights?.cpc || '0') / 100,
                  conversions: 0,
                  dateStart,
                  dateEnd,
                  lastSyncedAt: new Date(),
                },
                update: {
                  name: fbAdSet.name,
                  status: mapFacebookStatus(fbAdSet.status, 'adset') as AdSetStatus,
                  budget: parseFloat(fbAdSet.daily_budget || fbAdSet.lifetime_budget || '0') / 100,
                  spent: parseFloat(insights?.spend || '0') / 100,
                  impressions: parseInt(insights?.impressions || '0'),
                  clicks: parseInt(insights?.clicks || '0'),
                  ctr: parseFloat(insights?.ctr || '0'),
                  cpc: parseFloat(insights?.cpc || '0') / 100,
                  lastSyncedAt: new Date(),
                },
              });

              synced++;
            } catch (error) {
              const msg = `Failed to sync ad set ${fbAdSet.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              errors.push(msg);
              console.warn(msg);
            }
          }
        } catch (error) {
          const msg = `Failed to fetch ad sets for campaign ${campaign.facebookCampaignId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(msg);
          console.warn(msg);
        }
      }
    } catch (error) {
      const msg = `Failed to sync ad sets: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(msg);
      console.error(msg);
    }

    return { synced, errors };
  }

  /**
   * Sync ads from Facebook to database
   */
  private async syncAds(options: SyncOptions): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      // Get all ad sets from database
      const adSets = await prisma.adGroup.findMany({
        where: {
          campaign: { adAccountId: this.adAccountDbId },
        },
        select: { id: true, facebookAdSetId: true },
      });

      for (const adSet of adSets) {
        if (!adSet.facebookAdSetId) continue;

        try {
          const facebookAds = await this.api.getAds(adSet.facebookAdSetId);

          for (const fbAd of facebookAds) {
            try {
              const insights = await this.api
                .getAdInsights(fbAd.id, {
                  dateFrom: options.dateFrom,
                  dateTo: options.dateTo,
                })
                .catch(() => null);

              // Note: Facebook API returns spend in cents, so we divide by 100 to get dollars
              const dateStart = parseDate(options.dateFrom);
              const dateEnd = parseDate(options.dateTo);
              
              await prisma.creative.upsert({
                where: { facebookAdId: fbAd.id },
                create: {
                  adGroupId: adSet.id,
                  facebookAdId: fbAd.id,
                  name: fbAd.name,
                  format: 'Facebook Ad',
                  status: mapFacebookStatus(fbAd.status, 'ad') as CreativeStatus,
                  impressions: parseInt(insights?.impressions || '0'),
                  clicks: parseInt(insights?.clicks || '0'),
                  ctr: parseFloat(insights?.ctr || '0'),
                  engagement: parseInt(insights?.impressions || '0'),
                  spend: parseFloat(insights?.spend || '0') / 100,
                  roas: 0,
                  dateStart,
                  dateEnd,
                  lastSyncedAt: new Date(),
                },
                update: {
                  name: fbAd.name,
                  status: mapFacebookStatus(fbAd.status, 'ad') as CreativeStatus,
                  impressions: parseInt(insights?.impressions || '0'),
                  clicks: parseInt(insights?.clicks || '0'),
                  ctr: parseFloat(insights?.ctr || '0'),
                  engagement: parseInt(insights?.impressions || '0'),
                  spend: parseFloat(insights?.spend || '0') / 100,
                  lastSyncedAt: new Date(),
                },
              });

              synced++;
            } catch (error) {
              const msg = `Failed to sync ad ${fbAd.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
              errors.push(msg);
              console.warn(msg);
            }
          }
        } catch (error) {
          const msg = `Failed to fetch ads for ad set ${adSet.facebookAdSetId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(msg);
          console.warn(msg);
        }
      }
    } catch (error) {
      const msg = `Failed to sync ads: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(msg);
      console.error(msg);
    }

    return { synced, errors };
  }
}

/**
 * Sync all ad accounts that need updating
 */
export async function syncAllAdAccounts(): Promise<{
  synced: number;
  errors: string[];
}> {
  const result = { synced: 0, errors: [] as string[] };

  try {
    // Get all ad accounts that need syncing (not synced in last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - SYNC_INTERVAL);
    const adAccounts = await prisma.adAccount.findMany({
      where: {
        facebookAccessToken: { not: null },
        facebookAdAccountId: { not: null },
        OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: tenMinutesAgo } }],
      },
      select: {
        id: true,
        facebookAccessToken: true,
        facebookAdAccountId: true,
      },
    });

    console.log(`Found ${adAccounts.length} ad accounts to sync`);

    for (const adAccount of adAccounts) {
      if (!adAccount.facebookAccessToken || !adAccount.facebookAdAccountId) continue;

      try {
        const syncService = new FacebookSyncService(
          adAccount.facebookAccessToken,
          adAccount.facebookAdAccountId,
          adAccount.id
        );

        const syncResult = await syncService.syncAll();

        if (syncResult.success) {
          result.synced++;
        }

        result.errors.push(...syncResult.errors);
      } catch (error) {
        const msg = `Failed to sync ad account ${adAccount.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(msg);
        console.error(msg);
      }
    }
  } catch (error) {
    const msg = `Failed to sync ad accounts: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(msg);
    console.error(msg);
  }

  return result;
}
