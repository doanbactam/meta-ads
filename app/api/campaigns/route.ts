import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCampaigns } from '@/lib/api/campaigns';
import { getOrCreateUserFromClerk } from '@/lib/api/users';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const adAccountId = searchParams.get('adAccountId');

    if (!adAccountId) {
      return NextResponse.json({ campaigns: [] });
    }

    const user = await getOrCreateUserFromClerk(clerkId);
    const adAccount = await prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId: user.id,
      },
    });

    if (!adAccount) {
      return NextResponse.json({ error: 'Ad account not found or access denied' }, { status: 403 });
    }

    // Check if Facebook is connected
    if (!adAccount.facebookAccessToken || !adAccount.facebookAdAccountId) {
      return NextResponse.json({ 
        campaigns: [],
        message: 'Facebook not connected. Please connect your Facebook account to view campaigns.'
      });
    }

    // Check if token is expired
    if (adAccount.facebookTokenExpiry && adAccount.facebookTokenExpiry < new Date()) {
      return NextResponse.json({ 
        campaigns: [],
        message: 'Facebook token expired. Please reconnect your Facebook account.'
      });
    }

    // Fetch campaigns from Facebook API
    try {
      const { FacebookMarketingAPI } = await import('@/lib/facebook-api');
      const api = new FacebookMarketingAPI(adAccount.facebookAccessToken);
      
      const facebookCampaigns = await api.getCampaigns(adAccount.facebookAdAccountId);
      
      // Get insights for each campaign
      const campaignsWithInsights = await Promise.all(
        facebookCampaigns.map(async (campaign) => {
          const insights = await api.getCampaignInsights(campaign.id);
          
          return {
            id: campaign.id,
            name: campaign.name,
            status: mapFacebookStatus(campaign.status),
            budget: parseFloat(campaign.lifetimeBudget || campaign.dailyBudget || '0') / 100, // Convert cents to dollars
            spent: parseFloat(insights?.spend || '0'),
            impressions: parseInt(insights?.impressions || '0'),
            clicks: parseInt(insights?.clicks || '0'),
            ctr: parseFloat(insights?.ctr || '0'),
            conversions: 0, // Facebook doesn't provide this in basic insights
            cost_per_conversion: parseFloat(insights?.costPerConversion || '0'),
            date_start: null,
            date_end: null,
            schedule: 'Facebook Managed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        })
      );

      return NextResponse.json({ campaigns: campaignsWithInsights });
    } catch (facebookError) {
      console.error('Error fetching from Facebook API:', facebookError);

      // Check if it's a token expiry error
      if (facebookError instanceof Error && facebookError.message === 'FACEBOOK_TOKEN_EXPIRED') {
        return NextResponse.json(
          {
            campaigns: [],
            error: 'Facebook access token has expired. Please reconnect your Facebook account.',
            code: 'TOKEN_EXPIRED'
          },
          { status: 401 }
        );
      }

      return NextResponse.json({
        campaigns: [],
        error: 'Failed to fetch campaigns from Facebook. Please check your connection.'
      });
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

function mapFacebookStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'ACTIVE': 'Eligible',
    'PAUSED': 'Paused',
    'DELETED': 'Removed',
    'ARCHIVED': 'Ended',
  };
  return statusMap[status] || 'Pending';
}
