import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserFromClerk } from '@/lib/api/users';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const user = await getOrCreateUserFromClerk(clerkId);
    
    // Verify user has access to this ad account
    const adAccount = await prisma.adAccount.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!adAccount) {
      return NextResponse.json({ error: 'Ad account not found' }, { status: 404 });
    }

    // Get stats from Facebook API if connected
    if (adAccount.facebookAccessToken && adAccount.facebookAdAccountId) {
      try {
        const { FacebookMarketingAPI } = await import('@/lib/facebook-api');
        const api = new FacebookMarketingAPI(adAccount.facebookAccessToken);
        
        const facebookCampaigns = await api.getCampaigns(adAccount.facebookAdAccountId);
        
        let totalSpent = 0;
        let totalImpressions = 0;
        let totalClicks = 0;
        let activeCampaigns = 0;
        
        // Get insights for each campaign
        for (const campaign of facebookCampaigns) {
          const insights = await api.getCampaignInsights(campaign.id);
          
          if (insights) {
            totalSpent += parseFloat(insights.spend || '0');
            totalImpressions += parseInt(insights.impressions || '0');
            totalClicks += parseInt(insights.clicks || '0');
          }
          
          if (campaign.status === 'ACTIVE') {
            activeCampaigns++;
          }
        }
        
        const stats = {
          totalSpent,
          totalImpressions,
          totalClicks,
          totalCampaigns: facebookCampaigns.length,
          activeCampaigns,
        };

        return NextResponse.json(stats);
      } catch (facebookError) {
        console.error('Error fetching Facebook stats:', facebookError);
        // Fall back to empty stats if Facebook API fails
      }
    }

    // Return empty stats if no Facebook connection
    const stats = {
      totalSpent: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalCampaigns: 0,
      activeCampaigns: 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching ad account stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}