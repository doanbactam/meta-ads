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
      return NextResponse.json({ adSets: [] });
    }

    const user = await getOrCreateUserFromClerk(clerkId);
    
    // Validate Facebook token
    const tokenResult = await getValidFacebookToken(adAccountId, user.id);
    if ('error' in tokenResult) {
      if (tokenResult.status === 401) {
        return NextResponse.json(
          {
            adSets: [],
            error: tokenResult.error,
            code: 'TOKEN_EXPIRED'
          },
          { status: 401 }
        );
      }
      return NextResponse.json({ adSets: [], error: tokenResult.error }, { status: tokenResult.status });
    }

    const { token, adAccount } = tokenResult;

    // Check if Facebook ad account ID exists
    if (!adAccount.facebookAdAccountId) {
      return NextResponse.json(
        { adSets: [], error: 'Facebook ad account not configured' },
        { status: 400 }
      );
    }

    // Fetch ad sets from Facebook API
    try {
      const { FacebookMarketingAPI } = await import('@/lib/server/facebook-api');
      const api = new FacebookMarketingAPI(token);
      
      // First get all campaigns for this ad account
      const facebookCampaigns = await api.getCampaigns(adAccount.facebookAdAccountId);
      
      // Prepare date options for insights
      const dateOptions = fromDate && toDate ? {
        dateFrom: new Date(fromDate).toISOString().split('T')[0],
        dateTo: new Date(toDate).toISOString().split('T')[0],
      } : undefined;

      // Then get ad sets for each campaign
      const allAdSets = [];
      
      for (const campaign of facebookCampaigns) {
        try {
          const campaignAdSets = await api.getAdSets(campaign.id);
          
          // Add campaign info to each ad set and get insights
          for (const adSet of campaignAdSets) {
            const insights = await api.getAdSetInsights(adSet.id, dateOptions).catch(() => null);
            
            allAdSets.push({
              id: adSet.id,
              name: adSet.name,
              campaign_name: campaign.name,
              campaign_id: campaign.id,
              status: mapFacebookStatus(adSet.status, 'adset'),
              budget: parseFloat(adSet.daily_budget || adSet.lifetime_budget || '0') / 100,
              spent: parseFloat(insights?.spend || '0'),
              impressions: parseInt(insights?.impressions || '0'),
              clicks: parseInt(insights?.clicks || '0'),
              ctr: parseFloat(insights?.ctr || '0'),
              cpc: parseFloat(insights?.cpc || '0'),
              conversions: parseInt(insights?.conversions || '0'),
              date_start: null,
              date_end: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        } catch (campaignError) {
          console.warn(`Failed to fetch ad sets for campaign ${campaign.id}:`, campaignError);
        }
      }

      return NextResponse.json({ adSets: allAdSets });
    } catch (facebookError) {
      console.error('Error fetching from Facebook API:', facebookError);

      // Handle token expiry
      await handleFacebookTokenError(adAccountId, facebookError);

      // Check if it's a token expiry error
      if (facebookError instanceof Error && facebookError.message === 'FACEBOOK_TOKEN_EXPIRED') {
        return NextResponse.json(
          {
            adSets: [],
            error: 'Facebook access token has expired. Please reconnect your Facebook account.',
            code: 'TOKEN_EXPIRED'
          },
          { status: 401 }
        );
      }

      return NextResponse.json({
        adSets: [],
        error: 'Failed to fetch ad sets from Facebook. Please check your connection.'
      });
    }
  } catch (error) {
    console.error('Error fetching ad sets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ad sets' },
      { status: 500 }
    );
  }
}
