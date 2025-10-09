import { Prisma } from '@prisma/client';
import type { AdSetStatus, CampaignStatus, CreativeStatus } from '@prisma/client';
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';
import { prisma } from '@/lib/server/prisma';
import { getPlainFacebookToken } from '@/lib/server/token-utils';
import { handleTokenRevocationFromError } from '@/lib/server/token-revocation';
import {
  getBudgetAmount,
  safeParseDate,
  sanitizeFacebookAd,
  sanitizeFacebookAdSet,
  sanitizeFacebookCampaign,
  sanitizeFacebookStatus,
} from '@/lib/shared/data-sanitizer';

type ConcurrencyLimiter = <T>(fn: () => Promise<T>) => Promise<T>;

function createConcurrencyLimiter(limit: number): ConcurrencyLimiter {
  let activeCount = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    activeCount = Math.max(0, activeCount - 1);
    const resolver = queue.shift();
    resolver?.();
  };

  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (activeCount >= limit) {
      await new Promise<void>((resolve) => {
        queue.push(resolve);
      });
    }

    activeCount++;

    try {
      return await fn();
    } finally {
      next();
    }
  };
}

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
const API_CONCURRENCY_LIMIT = 5;

export class FacebookSyncService {
  private api: FacebookMarketingAPI;
  private adAccountId: string;
  private adAccountDbId: string;
  private limit: ConcurrencyLimiter;

  constructor(accessToken: string, adAccountId: string, adAccountDbId: string) {
    this.api = new FacebookMarketingAPI(accessToken);
    this.adAccountId = adAccountId;
    this.adAccountDbId = adAccountDbId;
    this.limit = createConcurrencyLimiter(API_CONCURRENCY_LIMIT);
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
        let errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
        const tokenRevoked = await handleTokenRevocationFromError(
          this.adAccountDbId,
          error
        ).catch((revocationError) => {
          console.error(
            `Failed to process token revocation for ${this.adAccountDbId}:`,
            revocationError
          );
          return false;
        });

        if (tokenRevoked) {
          errorMessage = 'Facebook token expired or was revoked. Please reconnect your account.';
        }

        result.errors.push(errorMessage);

        if (!tokenRevoked) {
          await prisma.adAccount
            .update({
              where: { id: this.adAccountDbId },
              data: {
                syncStatus: 'ERROR',
                syncError: errorMessage,
              },
            })
            .catch((updateError) => {
              console.error('Failed to update ad account after sync failure:', updateError);
            });
        }

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

<<<<<<< ours
      for (const fbCampaignRaw of facebookCampaigns) {
        try {
          // Sanitize and validate campaign data
          const fbCampaign = sanitizeFacebookCampaign(fbCampaignRaw);

          // Get insights for the campaign
          const insights = await this.api
            .getCampaignInsights(fbCampaign.id, {
              dateFrom: options.dateFrom,
              dateTo: options.dateTo,
            })
            .catch(() => null);

          // Get budget with safe parsing (already converted from cents to dollars)
          const budget = getBudgetAmount(fbCampaign.dailyBudget, fbCampaign.lifetimeBudget);

          // Resolve reporting window
          const optionDateStart = options.dateFrom ? safeParseDate(options.dateFrom) : undefined;
          const optionDateEnd = options.dateTo ? safeParseDate(options.dateTo) : undefined;

          const dateStart =
            insights?.dateStart ??
            fbCampaign.startTime ??
            fbCampaign.createdTime ??
            optionDateStart ??
            new Date();

          const dateEnd =
            insights?.dateStop ??
            fbCampaign.stopTime ??
            fbCampaign.updatedTime ??
            optionDateEnd ??
            dateStart;

          // Validate and map status
          const status = sanitizeFacebookStatus(
            fbCampaign.status,
            'campaign',
            'PAUSED'
          ) as CampaignStatus;

          await prisma.campaign.upsert({
            where: { facebookCampaignId: fbCampaign.id },
            create: {
              adAccountId: this.adAccountDbId,
=======
      const campaignTasks = facebookCampaigns.map((fbCampaignRaw) =>
        this.limit(async () => {
          try {
            const fbCampaign = sanitizeFacebookCampaign(fbCampaignRaw);

            const insightsRaw = await this.api
              .getCampaignInsights(fbCampaign.id, {
                dateFrom: options.dateFrom,
                dateTo: options.dateTo,
              })
              .catch(() => null);

            const insights = insightsRaw ? sanitizeFacebookInsights(insightsRaw) : null;

            const budget = getBudgetAmount(fbCampaign.dailyBudget, fbCampaign.lifetimeBudget);
            const dateStart = sanitizeDate(options.dateFrom);
            const dateEnd = sanitizeDate(options.dateTo);
            const status = sanitizeFacebookStatus(
              fbCampaign.status,
              'campaign',
              'PAUSED'
            ) as CampaignStatus;

            return {
>>>>>>> theirs
              facebookCampaignId: fbCampaign.id,
              name: fbCampaign.name,
              status,
              budget,
<<<<<<< ours
              spent: insights?.spend ?? 0,
              impressions: insights?.impressions ?? 0,
              clicks: insights?.clicks ?? 0,
              ctr: insights?.ctr ?? 0,
              conversions: insights?.conversions ?? 0,
              costPerConversion: insights?.costPerConversion ?? 0,
              facebookCreatedTime: fbCampaign.createdTime ?? null,
              facebookUpdatedTime: fbCampaign.updatedTime ?? null,
              startTime: fbCampaign.startTime ?? null,
              stopTime: fbCampaign.stopTime ?? null,
=======
              insights,
>>>>>>> theirs
              dateStart,
              dateEnd,
            };
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error while preparing campaign';
            throw new Error(
              `Failed to prepare campaign ${fbCampaignRaw?.id || 'unknown'}: ${message}`
            );
          }
        })
      );

      const campaignResults = await Promise.allSettled(campaignTasks);

      const campaignsToPersist: Array<{
        facebookCampaignId: string;
        name: string;
        status: CampaignStatus;
        budget: number;
        insights: ReturnType<typeof sanitizeFacebookInsights> | null;
        dateStart: Date;
        dateEnd: Date;
      }> = [];

      for (const result of campaignResults) {
        if (result.status === 'fulfilled') {
          campaignsToPersist.push(result.value);
        } else {
          const msg = `Failed to sync campaign: ${
            result.reason instanceof Error ? result.reason.message : String(result.reason)
          }`;
          errors.push(msg);
          console.warn(msg);
        }
      }

      const persistenceResults = await Promise.allSettled(
        campaignsToPersist.map((campaign) =>
          prisma.campaign.upsert({
            where: { facebookCampaignId: campaign.facebookCampaignId },
            create: {
              adAccountId: this.adAccountDbId,
              facebookCampaignId: campaign.facebookCampaignId,
              name: campaign.name,
              status: campaign.status,
              budget: campaign.budget,
              spent: campaign.insights?.spend ?? 0,
              impressions: campaign.insights?.impressions ?? 0,
              clicks: campaign.insights?.clicks ?? 0,
              ctr: campaign.insights?.ctr ?? 0,
              conversions: campaign.insights?.conversions ?? 0,
              costPerConversion: campaign.insights?.costPerConversion ?? 0,
              dateStart: campaign.dateStart,
              dateEnd: campaign.dateEnd,
              lastSyncedAt: new Date(),
            },
            update: {
<<<<<<< ours
              name: fbCampaign.name,
              status,
              budget,
              spent: insights?.spend ?? 0,
              impressions: insights?.impressions ?? 0,
              clicks: insights?.clicks ?? 0,
              ctr: insights?.ctr ?? 0,
              conversions: insights?.conversions ?? 0,
              costPerConversion: insights?.costPerConversion ?? 0,
              facebookCreatedTime: fbCampaign.createdTime ?? null,
              facebookUpdatedTime: fbCampaign.updatedTime ?? null,
              startTime: fbCampaign.startTime ?? null,
              stopTime: fbCampaign.stopTime ?? null,
              dateStart,
              dateEnd,
=======
              name: campaign.name,
              status: campaign.status,
              budget: campaign.budget,
              spent: campaign.insights?.spend ?? 0,
              impressions: campaign.insights?.impressions ?? 0,
              clicks: campaign.insights?.clicks ?? 0,
              ctr: campaign.insights?.ctr ?? 0,
              conversions: campaign.insights?.conversions ?? 0,
              costPerConversion: campaign.insights?.costPerConversion ?? 0,
>>>>>>> theirs
              lastSyncedAt: new Date(),
            },
          })
        )
      );

      for (const result of persistenceResults) {
        if (result.status === 'fulfilled') {
          synced++;
        } else {
          const msg = `Failed to persist campaign: ${
            result.reason instanceof Error ? result.reason.message : String(result.reason)
          }`;
          errors.push(msg);
          console.error(msg);
        }
      }
    } catch (error) {
      const tokenRevoked = await handleTokenRevocationFromError(this.adAccountDbId, error);
      if (tokenRevoked) {
        throw error;
      }

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

      const campaignTasks = campaigns
        .filter((campaign) => campaign.facebookCampaignId)
        .map((campaign) =>
          this.limit(async () => {
            try {
<<<<<<< ours
              // Sanitize and validate ad set data
              const fbAdSet = sanitizeFacebookAdSet(fbAdSetRaw);

              const insights = await this.api
                .getAdSetInsights(fbAdSet.id, {
                  dateFrom: options.dateFrom,
                  dateTo: options.dateTo,
                })
                .catch(() => null);

              // Get budget with safe parsing
              const budget = getBudgetAmount(fbAdSet.daily_budget, fbAdSet.lifetime_budget);

              // Resolve reporting window
              const optionDateStart = options.dateFrom ? safeParseDate(options.dateFrom) : undefined;
              const optionDateEnd = options.dateTo ? safeParseDate(options.dateTo) : undefined;

              const dateStart =
                insights?.dateStart ??
                fbAdSet.start_time ??
                fbAdSet.created_time ??
                optionDateStart ??
                new Date();

              const dateEnd =
                insights?.dateStop ??
                fbAdSet.end_time ??
                fbAdSet.updated_time ??
                optionDateEnd ??
                dateStart;

              // Validate and map status
              const status = sanitizeFacebookStatus(
                fbAdSet.status,
                'adset',
                'PAUSED'
              ) as AdSetStatus;

              await prisma.adGroup.upsert({
                where: { facebookAdSetId: fbAdSet.id },
                create: {
                  campaignId: campaign.id,
                  facebookAdSetId: fbAdSet.id,
                  name: fbAdSet.name,
                  status,
                  budget,
                  spent: insights?.spend ?? 0,
                  impressions: insights?.impressions ?? 0,
                  clicks: insights?.clicks ?? 0,
                  ctr: insights?.ctr ?? 0,
                  cpc: insights?.cpc ?? 0,
                  conversions: insights?.conversions ?? 0,
                  facebookCreatedTime: fbAdSet.created_time ?? null,
                  facebookUpdatedTime: fbAdSet.updated_time ?? null,
                  startTime: fbAdSet.start_time ?? null,
                  endTime: fbAdSet.end_time ?? null,
                  dateStart,
                  dateEnd,
                  lastSyncedAt: new Date(),
                },
                update: {
                  name: fbAdSet.name,
                  status,
                  budget,
                  spent: insights?.spend ?? 0,
                  impressions: insights?.impressions ?? 0,
                  clicks: insights?.clicks ?? 0,
                  ctr: insights?.ctr ?? 0,
                  cpc: insights?.cpc ?? 0,
                  conversions: insights?.conversions ?? 0,
                  facebookCreatedTime: fbAdSet.created_time ?? null,
                  facebookUpdatedTime: fbAdSet.updated_time ?? null,
                  startTime: fbAdSet.start_time ?? null,
                  endTime: fbAdSet.end_time ?? null,
                  dateStart,
                  dateEnd,
                  lastSyncedAt: new Date(),
                },
              });

              synced++;
=======
              const facebookAdSets = await this.api.getAdSets(campaign.facebookCampaignId!);
              return { campaign, facebookAdSets };
>>>>>>> theirs
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'Unknown error while fetching ad sets';
              throw new Error(
                `Failed to fetch ad sets for campaign ${
                  campaign.facebookCampaignId || 'unknown'
                }: ${message}`
              );
            }
          })
        );

      const campaignResults = await Promise.allSettled(campaignTasks);

      const adSetPreparationTasks: Array<Promise<{
        campaignId: string;
        facebookAdSetId: string;
        name: string;
        status: AdSetStatus;
        budget: number;
        insights: ReturnType<typeof sanitizeFacebookInsights> | null;
        dateStart: Date;
        dateEnd: Date;
        targeting: Prisma.InputJsonValue | Prisma.JsonNull;
      }>> = [];

      for (const result of campaignResults) {
        if (result.status === 'fulfilled') {
          const {
            campaign,
            facebookAdSets,
          } = result.value;
          for (const fbAdSetRaw of facebookAdSets) {
            adSetPreparationTasks.push(
              this.limit(async () => {
                try {
                  const fbAdSet = sanitizeFacebookAdSet(fbAdSetRaw);
                  const insightsRaw = await this.api
                    .getAdSetInsights(fbAdSet.id, {
                      dateFrom: options.dateFrom,
                      dateTo: options.dateTo,
                    })
                    .catch(() => null);
                  const insights = insightsRaw ? sanitizeFacebookInsights(insightsRaw) : null;
                  const budget = getBudgetAmount(
                    fbAdSet.daily_budget,
                    fbAdSet.lifetime_budget
                  );
                  const dateStart = sanitizeDate(options.dateFrom);
                  const dateEnd = sanitizeDate(options.dateTo);
                  const status = sanitizeFacebookStatus(
                    fbAdSet.status,
                    'adset',
                    'PAUSED'
                  ) as AdSetStatus;

                  const targeting =
                    fbAdSet.targeting === undefined || fbAdSet.targeting === null
                      ? Prisma.JsonNull
                      : (fbAdSet.targeting as Prisma.InputJsonValue);

                  return {
                    campaignId: campaign.id,
                    facebookAdSetId: fbAdSet.id,
                    name: fbAdSet.name,
                    status,
                    budget,
                    insights,
                    dateStart,
                    dateEnd,
                    targeting,
                  };
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : 'Unknown error while preparing ad set';
                  throw new Error(
                    `Failed to prepare ad set ${fbAdSetRaw?.id || 'unknown'}: ${message}`
                  );
                }
              })
            );
          }
<<<<<<< ours
        } catch (error) {
          const tokenRevoked = await handleTokenRevocationFromError(this.adAccountDbId, error);
          if (tokenRevoked) {
            throw error;
          }

          const msg = `Failed to fetch ad sets for campaign ${campaign.facebookCampaignId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
=======
        } else {
          const msg = `Failed to fetch ad sets: ${
            result.reason instanceof Error ? result.reason.message : String(result.reason)
          }`;
          errors.push(msg);
          console.warn(msg);
        }
      }

      const adSetResults = await Promise.allSettled(adSetPreparationTasks);

      const adSetsToPersist: Array<{
        campaignId: string;
        facebookAdSetId: string;
        name: string;
        status: AdSetStatus;
        budget: number;
        insights: ReturnType<typeof sanitizeFacebookInsights> | null;
        dateStart: Date;
        dateEnd: Date;
        targeting: Prisma.InputJsonValue | Prisma.JsonNull;
      }> = [];

      for (const result of adSetResults) {
        if (result.status === 'fulfilled') {
          adSetsToPersist.push(result.value);
        } else {
          const msg = `Failed to prepare ad set: ${
            result.reason instanceof Error ? result.reason.message : String(result.reason)
          }`;
>>>>>>> theirs
          errors.push(msg);
          console.warn(msg);
        }
      }

      const persistenceResults = await Promise.allSettled(
        adSetsToPersist.map((adSet) =>
          prisma.adGroup.upsert({
            where: { facebookAdSetId: adSet.facebookAdSetId },
            create: {
              campaignId: adSet.campaignId,
              facebookAdSetId: adSet.facebookAdSetId,
              name: adSet.name,
              status: adSet.status,
              budget: adSet.budget,
              spent: adSet.insights?.spend ?? 0,
              impressions: adSet.insights?.impressions ?? 0,
              clicks: adSet.insights?.clicks ?? 0,
              ctr: adSet.insights?.ctr ?? 0,
              cpc: adSet.insights?.cpc ?? 0,
              conversions: adSet.insights?.conversions ?? 0,
              dateStart: adSet.dateStart,
              dateEnd: adSet.dateEnd,
              targeting: adSet.targeting,
              lastSyncedAt: new Date(),
            },
            update: {
              name: adSet.name,
              status: adSet.status,
              budget: adSet.budget,
              spent: adSet.insights?.spend ?? 0,
              impressions: adSet.insights?.impressions ?? 0,
              clicks: adSet.insights?.clicks ?? 0,
              ctr: adSet.insights?.ctr ?? 0,
              cpc: adSet.insights?.cpc ?? 0,
              conversions: adSet.insights?.conversions ?? 0,
              targeting: adSet.targeting,
              lastSyncedAt: new Date(),
            },
          })
        )
      );

      for (const result of persistenceResults) {
        if (result.status === 'fulfilled') {
          synced++;
        } else {
          const msg = `Failed to persist ad set: ${
            result.reason instanceof Error ? result.reason.message : String(result.reason)
          }`;
          errors.push(msg);
          console.error(msg);
        }
      }
    } catch (error) {
      const tokenRevoked = await handleTokenRevocationFromError(this.adAccountDbId, error);
      if (tokenRevoked) {
        throw error;
      }

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

      const adSetTasks = adSets
        .filter((adSet) => adSet.facebookAdSetId)
        .map((adSet) =>
          this.limit(async () => {
            try {
<<<<<<< ours
              // Sanitize and validate ad data
              const fbAd = sanitizeFacebookAd(fbAdRaw);

              const insights = await this.api
                .getAdInsights(fbAd.id, {
                  dateFrom: options.dateFrom,
                  dateTo: options.dateTo,
                })
                .catch(() => null);

              const optionDateStart = options.dateFrom ? safeParseDate(options.dateFrom) : undefined;
              const optionDateEnd = options.dateTo ? safeParseDate(options.dateTo) : undefined;

              // Resolve reporting window
              const dateStart =
                insights?.dateStart ??
                optionDateStart ??
                fbAd.created_time ??
                new Date();

              const dateEnd =
                insights?.dateStop ??
                optionDateEnd ??
                fbAd.updated_time ??
                dateStart;

              // Validate and map status
              const status = sanitizeFacebookStatus(fbAd.status, 'ad', 'PAUSED') as CreativeStatus;

              await prisma.creative.upsert({
                where: { facebookAdId: fbAd.id },
                create: {
                  adGroupId: adSet.id,
                  facebookAdId: fbAd.id,
                  name: fbAd.name,
                  format: 'Facebook Ad',
                  status,
                  impressions: insights?.impressions ?? 0,
                  clicks: insights?.clicks ?? 0,
                  ctr: insights?.ctr ?? 0,
                  engagement: insights?.impressions ?? 0,
                  spend: insights?.spend ?? 0,
                  roas: 0,
                  dateStart,
                  dateEnd,
                  lastSyncedAt: new Date(),
                },
                update: {
                  name: fbAd.name,
                  status,
                  impressions: insights?.impressions ?? 0,
                  clicks: insights?.clicks ?? 0,
                  ctr: insights?.ctr ?? 0,
                  engagement: insights?.impressions ?? 0,
                  spend: insights?.spend ?? 0,
                  dateStart,
                  dateEnd,
                  lastSyncedAt: new Date(),
                },
              });

              synced++;
=======
              const facebookAds = await this.api.getAds(adSet.facebookAdSetId!);
              return { adSet, facebookAds };
>>>>>>> theirs
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'Unknown error while fetching ads';
              throw new Error(
                `Failed to fetch ads for ad set ${adSet.facebookAdSetId || 'unknown'}: ${message}`
              );
            }
          })
        );

      const adSetResults = await Promise.allSettled(adSetTasks);

      const adPreparationTasks: Array<Promise<{
        adGroupId: string;
        facebookAdId: string;
        name: string;
        status: CreativeStatus;
        insights: ReturnType<typeof sanitizeFacebookInsights> | null;
        dateStart: Date;
        dateEnd: Date;
      }>> = [];

      for (const result of adSetResults) {
        if (result.status === 'fulfilled') {
          const { adSet, facebookAds } = result.value;
          for (const fbAdRaw of facebookAds) {
            adPreparationTasks.push(
              this.limit(async () => {
                try {
                  const fbAd = sanitizeFacebookAd(fbAdRaw);
                  const insightsRaw = await this.api
                    .getAdInsights(fbAd.id, {
                      dateFrom: options.dateFrom,
                      dateTo: options.dateTo,
                    })
                    .catch(() => null);
                  const insights = insightsRaw ? sanitizeFacebookInsights(insightsRaw) : null;
                  const dateStart = sanitizeDate(options.dateFrom);
                  const dateEnd = sanitizeDate(options.dateTo);
                  const status = sanitizeFacebookStatus(
                    fbAd.status,
                    'ad',
                    'PAUSED'
                  ) as CreativeStatus;

                  return {
                    adGroupId: adSet.id,
                    facebookAdId: fbAd.id,
                    name: fbAd.name,
                    status,
                    insights,
                    dateStart,
                    dateEnd,
                  };
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : 'Unknown error while preparing ad';
                  throw new Error(`Failed to prepare ad ${fbAdRaw?.id || 'unknown'}: ${message}`);
                }
              })
            );
          }
<<<<<<< ours
        } catch (error) {
          const tokenRevoked = await handleTokenRevocationFromError(this.adAccountDbId, error);
          if (tokenRevoked) {
            throw error;
          }

          const msg = `Failed to fetch ads for ad set ${adSet.facebookAdSetId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
=======
        } else {
          const msg = `Failed to fetch ads: ${
            result.reason instanceof Error ? result.reason.message : String(result.reason)
          }`;
          errors.push(msg);
          console.warn(msg);
        }
      }

      const adResults = await Promise.allSettled(adPreparationTasks);

      const adsToPersist: Array<{
        adGroupId: string;
        facebookAdId: string;
        name: string;
        status: CreativeStatus;
        insights: ReturnType<typeof sanitizeFacebookInsights> | null;
        dateStart: Date;
        dateEnd: Date;
      }> = [];

      for (const result of adResults) {
        if (result.status === 'fulfilled') {
          adsToPersist.push(result.value);
        } else {
          const msg = `Failed to prepare ad: ${
            result.reason instanceof Error ? result.reason.message : String(result.reason)
          }`;
>>>>>>> theirs
          errors.push(msg);
          console.warn(msg);
        }
      }

      const persistenceResults = await Promise.allSettled(
        adsToPersist.map((ad) =>
          prisma.creative.upsert({
            where: { facebookAdId: ad.facebookAdId },
            create: {
              adGroupId: ad.adGroupId,
              facebookAdId: ad.facebookAdId,
              name: ad.name,
              format: 'Facebook Ad',
              status: ad.status,
              impressions: ad.insights?.impressions ?? 0,
              clicks: ad.insights?.clicks ?? 0,
              ctr: ad.insights?.ctr ?? 0,
              engagement: ad.insights?.impressions ?? 0,
              spend: ad.insights?.spend ?? 0,
              roas: 0,
              dateStart: ad.dateStart,
              dateEnd: ad.dateEnd,
              lastSyncedAt: new Date(),
            },
            update: {
              name: ad.name,
              status: ad.status,
              impressions: ad.insights?.impressions ?? 0,
              clicks: ad.insights?.clicks ?? 0,
              ctr: ad.insights?.ctr ?? 0,
              engagement: ad.insights?.impressions ?? 0,
              spend: ad.insights?.spend ?? 0,
              lastSyncedAt: new Date(),
            },
          })
        )
      );

      for (const result of persistenceResults) {
        if (result.status === 'fulfilled') {
          synced++;
        } else {
          const msg = `Failed to persist ad: ${
            result.reason instanceof Error ? result.reason.message : String(result.reason)
          }`;
          errors.push(msg);
          console.error(msg);
        }
      }
    } catch (error) {
      const tokenRevoked = await handleTokenRevocationFromError(this.adAccountDbId, error);
      if (tokenRevoked) {
        throw error;
      }

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

      const { token: plainToken, error: decodeError } = getPlainFacebookToken(
        adAccount.facebookAccessToken
      );

      if (!plainToken) {
        const msg =
          decodeError ||
          `Stored token for ad account ${adAccount.id} is invalid. Skipping sync.`;
        result.errors.push(msg);

        await prisma.adAccount.update({
          where: { id: adAccount.id },
          data: {
            syncStatus: 'ERROR',
            syncError: msg,
            status: 'PAUSED',
            facebookTokenExpiry: new Date(),
          },
        }).catch((error) => {
          console.error('Failed to update ad account after token decode failure:', error);
        });

        continue;
      }

      try {
        const syncService = new FacebookSyncService(
          plainToken,
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
