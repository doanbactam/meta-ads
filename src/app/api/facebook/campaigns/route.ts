import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/server/prisma';
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';

async function getAdAccountWithValidation(userId: string, adAccountId: string) {
  const user = await getOrCreateUserFromClerk(userId);

  const adAccount = await prisma.adAccount.findFirst({
    where: {
      id: adAccountId,
      userId: user.id,
    },
  });

  if (!adAccount) {
    return { error: 'Ad account not found', status: 404 };
  }

  if (!adAccount.facebookAccessToken || !adAccount.facebookAdAccountId) {
    return { error: 'Facebook not connected', status: 400 };
  }

  if (adAccount.facebookTokenExpiry && adAccount.facebookTokenExpiry < new Date()) {
    return { error: 'Token expired', status: 401 };
  }

  return { adAccount };
}

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

    const result = await getAdAccountWithValidation(userId, adAccountId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { adAccount } = result;
    const api = new FacebookMarketingAPI(adAccount.facebookAccessToken!);

    try {
      const campaigns = await api.getCampaigns(adAccount.facebookAdAccountId!);

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
    } catch (apiError: any) {
      if (apiError.message === 'FACEBOOK_TOKEN_EXPIRED') {
        await prisma.adAccount.update({
          where: { id: adAccount.id },
          data: { facebookTokenExpiry: new Date(0) },
        });
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

    const result = await getAdAccountWithValidation(userId, adAccountId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { adAccount } = result;
    const api = new FacebookMarketingAPI(adAccount.facebookAccessToken!);

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
      `https://graph.facebook.com/v23.0/${formattedAccountId}/campaigns?access_token=${adAccount.facebookAccessToken!}`,
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

    const result = await getAdAccountWithValidation(userId, adAccountId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { adAccount } = result;

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${campaignId}?access_token=${adAccount.facebookAccessToken!}`,
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
