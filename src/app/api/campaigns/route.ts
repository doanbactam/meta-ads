import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { getValidFacebookToken, handleFacebookTokenError } from '@/lib/server/api/facebook-auth';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';
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
      return NextResponse.json({ campaigns: [] });
    }

    const user = await getOrCreateUserFromClerk(clerkId);

    // Validate Facebook token
    const tokenResult = await getValidFacebookToken(adAccountId, user.id);
    if ('error' in tokenResult) {
      if (tokenResult.status === 401) {
        return NextResponse.json(
          {
            campaigns: [],
            error: tokenResult.error,
            code: 'TOKEN_EXPIRED',
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { campaigns: [], error: tokenResult.error },
        { status: tokenResult.status }
      );
    }

    const { token, adAccount } = tokenResult;

    // Check if Facebook ad account ID exists
    if (!adAccount.facebookAdAccountId) {
      return NextResponse.json(
        { campaigns: [], error: 'Facebook ad account not configured' },
        { status: 400 }
      );
    }

    // Fetch campaigns from Facebook API
    try {
      const { FacebookMarketingAPI } = await import('@/lib/server/facebook-api');
      const api = new FacebookMarketingAPI(token);

      const facebookCampaigns = await api.getCampaigns(adAccount.facebookAdAccountId);

      // Get insights for each campaign with date range support
      const dateOptions =
        fromDate && toDate
          ? {
              dateFrom: new Date(fromDate).toISOString().split('T')[0],
              dateTo: new Date(toDate).toISOString().split('T')[0],
            }
          : undefined;

      const campaignsWithInsights = await Promise.all(
        facebookCampaigns.map(async (campaign) => {
          const insights = await api.getCampaignInsights(campaign.id, dateOptions);

          return {
            id: campaign.id,
            name: campaign.name,
            status: mapFacebookStatus(campaign.status, 'campaign'),
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

      // Handle token expiry
      await handleFacebookTokenError(adAccountId, facebookError);

      // Check if it's a token expiry error
      if (facebookError instanceof Error && facebookError.message === 'FACEBOOK_TOKEN_EXPIRED') {
        return NextResponse.json(
          {
            campaigns: [],
            error: 'Facebook access token has expired. Please reconnect your Facebook account.',
            code: 'TOKEN_EXPIRED',
          },
          { status: 401 }
        );
      }

      return NextResponse.json({
        campaigns: [],
        error: 'Failed to fetch campaigns from Facebook. Please check your connection.',
      });
    }
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}
