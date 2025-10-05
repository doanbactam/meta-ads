import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { getValidFacebookToken, handleFacebookTokenError } from '@/lib/server/api/facebook-auth';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const user = await getOrCreateUserFromClerk(clerkId);

    // Validate Facebook token and get ad account
    const tokenResult = await getValidFacebookToken(id, user.id);

    // Handle token validation errors
    if ('error' in tokenResult) {
      if (tokenResult.status === 401) {
        return NextResponse.json(
          {
            error: tokenResult.error,
            code: 'TOKEN_EXPIRED',
            requiresReconnect: true,
          },
          { status: 401 }
        );
      }

      // Return 404 for ad account not found
      if (tokenResult.status === 404) {
        return NextResponse.json({ error: tokenResult.error }, { status: 404 });
      }

      // Return empty stats for other errors (not connected, etc.)
      return NextResponse.json({
        totalSpent: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalCampaigns: 0,
        activeCampaigns: 0,
      });
    }

    const { token, adAccount } = tokenResult;

    // Get stats from Facebook API
    if (adAccount.facebookAdAccountId) {
      try {
        const { FacebookMarketingAPI } = await import('@/lib/server/facebook-api');
        const api = new FacebookMarketingAPI(token);

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

        // Handle token expired error
        await handleFacebookTokenError(adAccount.id, facebookError);

        // Check if it's a token expiry error
        if (facebookError instanceof Error && facebookError.message === 'FACEBOOK_TOKEN_EXPIRED') {
          return NextResponse.json(
            {
              error: 'Facebook access token has expired. Please reconnect your Facebook account.',
              code: 'TOKEN_EXPIRED',
              requiresReconnect: true,
            },
            { status: 401 }
          );
        }

        // Fall back to empty stats if Facebook API fails for other reasons
        return NextResponse.json({
          totalSpent: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalCampaigns: 0,
          activeCampaigns: 0,
        });
      }
    }

    // Return empty stats if no Facebook connection
    return NextResponse.json({
      totalSpent: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalCampaigns: 0,
      activeCampaigns: 0,
    });
  } catch (error) {
    console.error('Error fetching ad account stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
