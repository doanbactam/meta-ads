import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  withAuth, 
  verifyAdAccountAccess, 
  parseDateRange, 
  calculatePercentageChange 
} from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(params, async (userId, { id: adAccountId }) => {
    const { searchParams } = new URL(request.url);
    const { dateFilter, from, to } = parseDateRange(searchParams);

    // Verify user has access to this ad account
    await verifyAdAccountAccess(userId, adAccountId);

    // Get current period stats
    const currentStats = await prisma.campaign.aggregate({
      where: {
        adAccountId: adAccountId,
        ...(dateFilter && { createdAt: dateFilter }),
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
          createdAt: {
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

    const currentSpend = currentStats._sum?.spent || 0;
    const currentImpressions = currentStats._sum?.impressions || 0;
    const currentClicks = currentStats._sum?.clicks || 0;
    const currentConversions = currentStats._sum?.conversions || 0;

    const previousSpend = previousStats?._sum?.spent || 0;
    const previousImpressions = previousStats?._sum?.impressions || 0;
    const previousClicks = previousStats?._sum?.clicks || 0;
    const previousConversions = previousStats?._sum?.conversions || 0;

    // Calculate derived metrics
    const averageCpc = currentClicks > 0 ? currentSpend / currentClicks : 0;
    const averageRoas = currentSpend > 0 ? (currentConversions * 100) / currentSpend : 0;

    const overviewStats = {
      totalSpend: currentSpend,
      totalImpressions: currentImpressions,
      totalClicks: currentClicks,
      totalConversions: currentConversions,
      averageCtr: currentStats._avg?.ctr || 0,
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