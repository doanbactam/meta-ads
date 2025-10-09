import { type NextRequest, NextResponse } from 'next/server';
import {
  calculatePercentageChange,
  parseDateRange,
  verifyAdAccountAccess,
  withAuth,
} from '@/lib/server/api-utils';
import { prisma } from '@/lib/server/prisma';

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(params, async (userId, { id: adAccountId }) => {
    const { searchParams } = new URL(request.url);
    const { dateFilter, from, to } = parseDateRange(searchParams);

    // Verify user has access to this ad account
    await verifyAdAccountAccess(userId, adAccountId);

    // Get current period stats
    const currentStats = await prisma.campaign.aggregate({
      where: {
        adAccountId: adAccountId,
        ...(dateFilter && { dateStart: dateFilter }),
      },
      _sum: {
        spent: true,
        impressions: true,
        clicks: true,
        conversions: true,
      },
      _avg: {
        ctr: true,
        costPerConversion: true,
      },
    });

    // Calculate previous period for comparison
    let previousStats = null;
    if (from && to) {
      const periodLength = to.getTime() - from.getTime();
      const previousFrom = new Date(from.getTime() - periodLength);
      const previousTo = new Date(from.getTime());

      previousStats = await prisma.campaign.aggregate({
        where: {
          adAccountId: adAccountId,
          dateStart: {
            gte: previousFrom,
            lte: previousTo,
          },
        },
        _sum: {
          spent: true,
          impressions: true,
          clicks: true,
          conversions: true,
        },
      });
    }

    const currentSpend = toNumber(currentStats._sum?.spent);
    const currentImpressions = toNumber(currentStats._sum?.impressions);
    const currentClicks = toNumber(currentStats._sum?.clicks);
    const currentConversions = toNumber(currentStats._sum?.conversions);

    const previousSpend = toNumber(previousStats?._sum?.spent);
    const previousImpressions = toNumber(previousStats?._sum?.impressions);
    const previousClicks = toNumber(previousStats?._sum?.clicks);
    const previousConversions = toNumber(previousStats?._sum?.conversions);

    // Calculate derived metrics
    const averageCpc = currentClicks > 0 ? currentSpend / currentClicks : 0;
    const averageRoas = currentSpend > 0 ? (currentConversions * 100) / currentSpend : 0;

    const overviewStats = {
      totalSpend: currentSpend,
      totalImpressions: currentImpressions,
      totalClicks: currentClicks,
      totalConversions: currentConversions,
      averageCtr: toNumber(currentStats._avg?.ctr),
      averageCpc: averageCpc,
      averageRoas: averageRoas,
      spendChange: calculatePercentageChange(currentSpend, previousSpend),
      impressionsChange: calculatePercentageChange(currentImpressions, previousImpressions),
      clicksChange: calculatePercentageChange(currentClicks, previousClicks),
      conversionsChange: calculatePercentageChange(currentConversions, previousConversions),
    };

    return NextResponse.json(overviewStats);
  });
}
