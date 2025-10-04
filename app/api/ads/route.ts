import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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
      return NextResponse.json({ ads: [] });
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
        ads: [],
        message: 'Facebook not connected. Please connect your Facebook account to view ads.'
      });
    }

    // Check if token is expired
    if (adAccount.facebookTokenExpiry && adAccount.facebookTokenExpiry < new Date()) {
      return NextResponse.json({ 
        ads: [],
        message: 'Facebook token expired. Please reconnect your Facebook account.'
      });
    }

    // Fetch ads from Facebook API
    try {
      const { FacebookMarketingAPI } = await import('@/lib/facebook-api');
      const api = new FacebookMarketingAPI(adAccount.facebookAccessToken);
      
      // Get all campaigns for this ad account
      const facebookCampaigns = await api.getCampaigns(adAccount.facebookAdAccountId);
      
      // Get all ads from all ad sets in all campaigns
      const allAds = [];
      
      for (const campaign of facebookCampaigns) {
        try {
          const campaignAdSets = await api.getAdSets(campaign.id);
          
          for (const adSet of campaignAdSets) {
            try {
              const adSetAds = await api.getAds(adSet.id);
              
              // Add campaign and ad set info to each ad
              for (const ad of adSetAds) {
                const insights = await api.getAdInsights(ad.id).catch(() => null);
                
                allAds.push({
                  id: ad.id,
                  name: ad.name,
                  ad_set_name: adSet.name,
                  ad_set_id: adSet.id,
                  campaign_name: campaign.name,
                  campaign_id: campaign.id,
                  format: 'Facebook Ad', // Facebook doesn't provide format in basic API
                  status: mapFacebookStatus(ad.status),
                  impressions: parseInt(insights?.impressions || '0'),
                  clicks: parseInt(insights?.clicks || '0'),
                  ctr: parseFloat(insights?.ctr || '0'),
                  engagement: parseInt(insights?.impressions || '0'), // Using impressions as engagement proxy
                  spend: parseFloat(insights?.spend || '0'),
                  roas: 0, // Would need conversion tracking setup
                  date_start: null,
                  date_end: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              }
            } catch (adError) {
              console.warn(`Failed to fetch ads for ad set ${adSet.id}:`, adError);
            }
          }
        } catch (adSetError) {
          console.warn(`Failed to fetch ad sets for campaign ${campaign.id}:`, adSetError);
        }
      }

      return NextResponse.json({ ads: allAds });
    } catch (facebookError) {
      console.error('Error fetching from Facebook API:', facebookError);
      return NextResponse.json({ 
        ads: [],
        error: 'Failed to fetch ads from Facebook. Please check your connection.'
      });
    }
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ads' },
      { status: 500 }
    );
  }
}

function mapFacebookStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'ACTIVE': 'Active',
    'PAUSED': 'Paused',
    'DELETED': 'Removed',
    'ARCHIVED': 'Ended',
  };
  return statusMap[status] || 'Pending';
}
