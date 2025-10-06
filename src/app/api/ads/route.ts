import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getValidFacebookToken } from '@/lib/server/api/facebook-auth';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';
import { prisma } from '@/lib/server/prisma';
import { FacebookSyncService } from '@/lib/server/facebook-sync-service';

/**
 * Ads API Route with Database Caching
 */

const CACHE_TTL = 5 * 60; // 5 minutes
const SYNC_THRESHOLD = 10 * 60 * 1000; // 10 minutes

async function getAdsFromDatabase(adAccountId: string) {
  const ads = await prisma.creative.findMany({
    where: {
      adGroup: {
        campaign: {
          adAccountId,
        },
      },
    },
    include: {
      adGroup: {
        select: {
          name: true,
          facebookAdSetId: true,
          campaign: {
            select: {
              name: true,
              facebookCampaignId: true,
            },
          },
        },
      },
    },
    orderBy: [
      { createdAt: 'desc' }, // Facebook API default: newest first
    ],
  });

  return ads.map((ad) => ({
    id: ad.facebookAdId || ad.id,
    name: ad.name,
    ad_set_name: ad.adGroup.name,
    ad_set_id: ad.adGroup.facebookAdSetId || ad.adGroupId,
    campaign_name: ad.adGroup.campaign.name,
    campaign_id: ad.adGroup.campaign.facebookCampaignId || ad.adGroup.campaign.name,
    format: ad.format,
    status: ad.status,
    impressions: ad.impressions,
    clicks: ad.clicks,
    ctr: ad.ctr,
    engagement: ad.engagement,
    spend: ad.spend,
    roas: ad.roas,
    date_start: ad.dateStart,
    date_end: ad.dateEnd,
    created_at: ad.createdAt.toISOString(),
    updated_at: ad.updatedAt.toISOString(),
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const adAccountId = searchParams.get('adAccountId');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!adAccountId) {
      return NextResponse.json({ ads: [] });
    }

    const user = await getOrCreateUserFromClerk(clerkId);

    // Get ad account
    const adAccount = await prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId: user.id,
      },
    });

    if (!adAccount) {
      return NextResponse.json({ error: 'Ad account not found' }, { status: 404 });
    }

    // Get cached data from database
    const getCachedAds = unstable_cache(
      async () => getAdsFromDatabase(adAccountId),
      [`ads-${adAccountId}`],
      {
        revalidate: CACHE_TTL,
        tags: [`ads-${adAccountId}`],
      }
    );

    const ads = await getCachedAds();

    // Check if we need to trigger a background sync
    const needsSync =
      !adAccount.lastSyncedAt ||
      Date.now() - adAccount.lastSyncedAt.getTime() > SYNC_THRESHOLD;

    if (needsSync && adAccount.facebookAccessToken && adAccount.facebookAdAccountId) {
      const tokenResult = await getValidFacebookToken(adAccountId, user.id);
      
      if (!('error' in tokenResult)) {
        const syncService = new FacebookSyncService(
          tokenResult.token,
          adAccount.facebookAdAccountId,
          adAccount.id
        );

        syncService
          .syncAll({
            dateFrom: fromDate || undefined,
            dateTo: toDate || undefined,
          })
          .catch((error) => {
            console.error('Background sync failed:', error);
          });
      }
    }

    return NextResponse.json(
      { ads },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 });
  }
}
