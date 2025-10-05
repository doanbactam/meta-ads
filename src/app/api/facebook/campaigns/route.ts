import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';
import { getValidFacebookToken, handleFacebookTokenError } from '@/lib/server/api/facebook-auth';

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
    const tokenResult = await getValidFacebookToken(adAccountId, user.id);
    
    if ('error' in tokenResult) {
      return NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status });
    }

    const { token, adAccount } = tokenResult;
    const api = new FacebookMarketingAPI(token);

    try {
      const campaigns = await api.getCampaigns(adAccount.facebookAdAccountId!);

      // Optimize: Fetch insights in parallel using Promise.all with controlled concurrency
      // Batch requests in groups of 10 to avoid overwhelming the API
      const BATCH_SIZE = 10;
      const campaignsWithInsights = [];
      
      for (let i = 0; i < campaigns.length; i += BATCH_SIZE) {
        const batch = campaigns.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (campaign) => {
            try {
              const insights = await api.getCampaignInsights(campaign.id);
              return {
                ...campaign,
                insights,
              };
            } catch (error) {
              // If insights fail, return campaign without insights
              console.error(`Failed to fetch insights for campaign ${campaign.id}:`, error);
              return {
                ...campaign,
                insights: null,
              };
            }
          })
        );
        campaignsWithInsights.push(...batchResults);
      }

      return NextResponse.json({ campaigns: campaignsWithInsights });
    } catch (apiError: any) {
      await handleFacebookTokenError(adAccount.id, apiError);
      
      if (apiError.message === 'FACEBOOK_TOKEN_EXPIRED') {
        return NextResponse.json({ error: 'Token expired', tokenExpired: true }, { status: 401 });
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Error fetching Facebook campaigns:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { adAccountId, name, objective, status, dailyBudget, lifetimeBudget } = body;

    if (!adAccountId || !name || !objective) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await getOrCreateUserFromClerk(userId);
    const tokenResult = await getValidFacebookToken(adAccountId, user.id);
    
    if ('error' in tokenResult) {
      return NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status });
    }

    const { token, adAccount } = tokenResult;

    const formattedAccountId = adAccount.facebookAdAccountId!.startsWith('act_')
      ? adAccount.facebookAdAccountId
      : `act_${adAccount.facebookAdAccountId}`;

    const campaignData: any = {
      name,
      objective,
      status: status || 'PAUSED',
    };

    if (dailyBudget) campaignData.daily_budget = dailyBudget;
    if (lifetimeBudget) campaignData.lifetime_budget = lifetimeBudget;

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${formattedAccountId}/campaigns?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to create campaign');
    }

    const data = await response.json();
    return NextResponse.json({ success: true, campaign: data });
  } catch (error) {
    console.error('Error creating Facebook campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const adAccountId = searchParams.get('adAccountId');
    const campaignId = searchParams.get('campaignId');

    if (!adAccountId || !campaignId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const user = await getOrCreateUserFromClerk(userId);
    const tokenResult = await getValidFacebookToken(adAccountId, user.id);
    
    if ('error' in tokenResult) {
      return NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status });
    }

    const { token } = tokenResult;

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${campaignId}?access_token=${token}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to delete campaign');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Facebook campaign:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
