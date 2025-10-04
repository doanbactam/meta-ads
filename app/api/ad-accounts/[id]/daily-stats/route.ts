import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: adAccountId } = await params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

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

    // Build date filter
    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    // Get campaigns with their daily stats
    const campaigns = await prisma.campaign.findMany({
      where: {
        adAccountId: adAccountId,
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      select: {
        spent: true,
        impressions: true,
        clicks: true,
        conversions: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date and aggregate
    const dailyStatsMap = new Map<string, {
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
    }>();

    campaigns.forEach(campaign => {
      const dateKey = campaign.createdAt.toISOString().split('T')[0];
      const existing = dailyStatsMap.get(dateKey) || {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
      };

      dailyStatsMap.set(dateKey, {
        spend: existing.spend + (campaign.spent || 0),
        impressions: existing.impressions + (campaign.impressions || 0),
        clicks: existing.clicks + (campaign.clicks || 0),
        conversions: existing.conversions + (campaign.conversions || 0),
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
    return NextResponse.json(
      { error: 'Failed to fetch daily stats' },
      { status: 500 }
    );
  }
}