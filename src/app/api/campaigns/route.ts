import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getValidFacebookToken } from '@/lib/server/api/facebook-auth';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';
import { prisma } from '@/lib/server/prisma';
import { FacebookSyncService } from '@/lib/server/facebook-sync-service';

/**
 * Campaigns API Route with Database Caching
 * 
 * Strategy:
 * 1. Check database first (fast)
 * 2. If no data or outdated (>10 min), trigger background sync
 * 3. Return cached data immediately
 * 4. Use Next.js unstable_cache for SSR
 */

const CACHE_TTL = 5 * 60; // 5 minutes
const SYNC_THRESHOLD = 10 * 60 * 1000; // 10 minutes

async function getCampaignsFromDatabase(adAccountId: string) {
  const campaigns = await prisma.campaign.findMany({
    where: { adAccountId },
    orderBy: { updatedAt: 'desc' },
  });

  return campaigns.map((campaign) => ({
    id: campaign.facebookCampaignId || campaign.id,
    name: campaign.name,
    status: campaign.status,
    budget: campaign.budget,
    spent: campaign.spent,
    impressions: campaign.impressions,
    clicks: campaign.clicks,
    ctr: campaign.ctr,
    conversions: campaign.conversions,
    cost_per_conversion: campaign.costPerConversion,
    date_start: campaign.dateStart,
    date_end: campaign.dateEnd,
    schedule: campaign.schedule,
    created_at: campaign.createdAt.toISOString(),
    updated_at: campaign.updatedAt.toISOString(),
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
      return NextResponse.json({ campaigns: [] });
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

    // Get cached data from database with Next.js cache
    const getCachedCampaigns = unstable_cache(
      async () => getCampaignsFromDatabase(adAccountId),
      [`campaigns-${adAccountId}`],
      {
        revalidate: CACHE_TTL,
        tags: [`campaigns-${adAccountId}`],
      }
    );

    const campaigns = await getCachedCampaigns();

    // Check if we need to trigger a background sync
    const needsSync =
      !adAccount.lastSyncedAt ||
      Date.now() - adAccount.lastSyncedAt.getTime() > SYNC_THRESHOLD;

    if (needsSync && adAccount.facebookAccessToken && adAccount.facebookAdAccountId) {
      // Trigger background sync (non-blocking)
      const tokenResult = await getValidFacebookToken(adAccountId, user.id);
      
      if (!('error' in tokenResult)) {
        // Don't await - let it run in background
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

    // Return cached data immediately
    return NextResponse.json(
      { campaigns },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=${CACHE_TTL * 2}`,
        },
      }
    );
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}
