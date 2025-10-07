import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: adAccountId } = await params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = parseInt(searchParams.get('limit') || '5', 10);

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

    // Get top campaigns by spend
    const topCampaigns = await prisma.campaign.findMany({
      where: {
        adAccountId: adAccountId,
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      select: {
        id: true,
        name: true,
        status: true,
        spent: true,
        impressions: true,
        clicks: true,
        conversions: true,
        ctr: true,
        costPerConversion: true,
      },
      orderBy: {
        spent: 'desc',
      },
      take: limit,
    });

    // Calculate ROAS and CPC for each campaign
    const enrichedCampaigns = topCampaigns.map((campaign) => {
      const cpc = campaign.clicks > 0 ? (campaign.spent || 0) / campaign.clicks : 0;
      const roas =
        (campaign.spent || 0) > 0 ? ((campaign.conversions || 0) * 100) / (campaign.spent || 0) : 0;

      return {
        ...campaign,
        spend: campaign.spent, // Map spent to spend for frontend compatibility
        cpc,
        roas,
      };
    });

    return NextResponse.json(enrichedCampaigns);
  } catch (error) {
    console.error('Error fetching top campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch top campaigns' }, { status: 500 });
  }
}
