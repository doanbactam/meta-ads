import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { parseDateRange } from '@/lib/server/api-utils';

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'object' && 'toNumber' in (value as { toNumber?: () => number })) {
    try {
      const numeric = (value as { toNumber?: () => number }).toNumber?.();
      return typeof numeric === 'number' && Number.isFinite(numeric) ? numeric : 0;
    } catch (error) {
      console.warn('Failed to convert Prisma Decimal to number', error);
      return 0;
    }
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const EMPTY_DAILY_STATS = {
  spend: 0,
  impressions: 0,
  clicks: 0,
  conversions: 0,
} as const;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: adAccountId } = await params;
    const { searchParams } = new URL(request.url);
    const { dateFilter } = parseDateRange(searchParams);

    // Verify user has access to this ad account
    const adAccount = await prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId: userId,
      },
    });

    if (!adAccount) {
      return NextResponse.json({ error: 'Ad account not found' }, { status: 404 });
    }

    // Get campaigns with their daily stats
    const campaigns = await prisma.campaign.findMany({
      where: {
        adAccountId: adAccountId,
        ...(dateFilter && {
          dateStart: dateFilter,
        }),
      },
      select: {
        spent: true,
        impressions: true,
        clicks: true,
        conversions: true,
        dateStart: true,
      },
      orderBy: {
        dateStart: 'asc',
      },
    });

    // Group by date and aggregate
    const dailyStatsMap = new Map<
      string,
      {
        spend: number;
        impressions: number;
        clicks: number;
        conversions: number;
      }
    >();

    campaigns.forEach((campaign) => {
      const date = campaign.dateStart instanceof Date ? campaign.dateStart : new Date(campaign.dateStart);
      if (Number.isNaN(date.getTime())) {
        return;
      }
      const dateKey = date.toISOString().split('T')[0];
      const spend = toNumber(campaign.spent);
      const impressions = toNumber(campaign.impressions);
      const clicks = toNumber(campaign.clicks);
      const conversions = toNumber(campaign.conversions);
      const existing = dailyStatsMap.get(dateKey) || { ...EMPTY_DAILY_STATS };

      dailyStatsMap.set(dateKey, {
        spend: existing.spend + spend,
        impressions: existing.impressions + impressions,
        clicks: existing.clicks + clicks,
        conversions: existing.conversions + conversions,
      });
    });

    // Convert to array and sort by date
    const dailyStats = Array.from(dailyStatsMap.entries())
      .map(([date, stats]) => ({
        date,
        ...stats,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(dailyStats);
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    return NextResponse.json({ error: 'Failed to fetch daily stats' }, { status: 500 });
  }
}
