import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';
import { getValidFacebookToken, handleFacebookTokenError } from '@/lib/server/api/facebook-auth';
import { mapFacebookStatus } from '@/lib/shared/formatters';

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
      return NextResponse.json({ ads: [] });
    }

    const user = await getOrCreateUserFromClerk(clerkId);
    
    // Validate Facebook token
    const tokenResult = await getValidFacebookToken(adAccountId, user.id);
    if ('error' in tokenResult) {
      if (tokenResult.status === 401) {
        return NextResponse.json(
          {
            ads: [],
            error: tokenResult.error,
            code: 'TOKEN_EXPIRED'
          },
          { status: 401 }
        );
      }
      return NextResponse.json({ ads: [], error: tokenResult.error }, { status: tokenResult.status });
    }

    const { token, adAccount } = tokenResult;

    // Fetch ads from Facebook API
    try {
      const { FacebookMarketingAPI } = await import('@/lib/server/facebook-api');
      const api = new FacebookMarketingAPI(token);
      
      // Prepare date options for insights
      const dateOptions = fromDate && toDate ? {
        dateFrom: new Date(fromDate).toISOString().split('T')[0],
        dateTo: new Date(toDate).toISOString().split('T')[0],
      } : undefined;

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
                const insights = await api.getAdInsights(ad.id, dateOptions).catch(() => null);
                
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

      // Handle token expiry
      await handleFacebookTokenError(adAccountId, facebookError);

      // Check if it's a token expiry error
      if (facebookError instanceof Error && facebookError.message === 'FACEBOOK_TOKEN_EXPIRED') {
        return NextResponse.json(
          {
            ads: [],
            error: 'Facebook access token has expired. Please reconnect your Facebook account.',
            code: 'TOKEN_EXPIRED'
          },
          { status: 401 }
        );
      }

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
