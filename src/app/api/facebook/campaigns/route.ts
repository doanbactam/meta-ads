import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/server/prisma';
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const adAccountId = searchParams.get('adAccountId');

    if (!adAccountId) {
      return NextResponse.json({ error: 'Ad account ID is required' }, { status: 400 });
    }

    const user = await getOrCreateUserFromClerk(userId);

    const adAccount = await prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId: user.id,
      },
    });

    if (!adAccount) {
      return NextResponse.json({ error: 'Ad account not found' }, { status: 404 });
    }

    if (!adAccount.facebookAccessToken || !adAccount.facebookAdAccountId) {
      return NextResponse.json({ error: 'Facebook not connected' }, { status: 400 });
    }

    if (adAccount.facebookTokenExpiry && adAccount.facebookTokenExpiry < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    const api = new FacebookMarketingAPI(adAccount.facebookAccessToken);
    const campaigns = await api.getCampaigns(adAccount.facebookAdAccountId);

    const campaignsWithInsights = await Promise.all(
      campaigns.map(async (campaign) => {
        const insights = await api.getCampaignInsights(campaign.id);
        return {
          ...campaign,
          insights,
        };
      })
    );

    return NextResponse.json({ campaigns: campaignsWithInsights });
  } catch (error) {
    console.error('Error fetching Facebook campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
