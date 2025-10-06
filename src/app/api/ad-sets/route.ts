import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getValidFacebookToken } from '@/lib/server/api/facebook-auth';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';
import { prisma } from '@/lib/server/prisma';
import { FacebookSyncService } from '@/lib/server/facebook-sync-service';

/**
 * Ad Sets API Route with Database Caching
 */

const CACHE_TTL = 5 * 60; // 5 minutes
const SYNC_THRESHOLD = 10 * 60 * 1000; // 10 minutes

async function getAdSetsFromDatabase(adAccountId: string) {
  const adSets = await prisma.adGroup.findMany({
    where: {
      campaign: {
        adAccountId,
      },
    },
    include: {
      campaign: {
        select: {
          name: true,
          facebookCampaignId: true,
        },
      },
    },
    orderBy: [
      { createdAt: 'desc' }, // Facebook API default: newest first
    ],
  });

  return adSets.map((adSet) => ({
    id: adSet.facebookAdSetId || adSet.id,
    name: adSet.name,
    campaign_name: adSet.campaign.name,
    campaign_id: adSet.campaign.facebookCampaignId || adSet.campaignId,
    status: adSet.status,
    budget: adSet.budget,
    spent: adSet.spent,
    impressions: adSet.impressions,
    clicks: adSet.clicks,
    ctr: adSet.ctr,
    cpc: adSet.cpc,
    conversions: adSet.conversions,
    date_start: adSet.dateStart,
    date_end: adSet.dateEnd,
    created_at: adSet.createdAt.toISOString(),
    updated_at: adSet.updatedAt.toISOString(),
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
      return NextResponse.json({ adSets: [] });
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
    const getCachedAdSets = unstable_cache(
      async () => getAdSetsFromDatabase(adAccountId),
      [`ad-sets-${adAccountId}`],
      {
        revalidate: CACHE_TTL,
        tags: [`ad-sets-${adAccountId}`],
      }
    );

    const adSets = await getCachedAdSets();

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
      { adSets },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching ad sets:', error);
    return NextResponse.json({ error: 'Failed to fetch ad sets' }, { status: 500 });
  }
}
