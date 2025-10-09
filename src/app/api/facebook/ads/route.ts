import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';
import { prisma } from '@/lib/server/prisma';
import { getPlainFacebookToken } from '@/lib/server/token-utils';

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

  if (!adAccount.facebookAccessToken) {
    return { error: 'Facebook not connected', status: 400 };
  }

  if (adAccount.facebookTokenExpiry && adAccount.facebookTokenExpiry < new Date()) {
    return { error: 'Token expired', status: 401 };
  }

  const { token, error } = getPlainFacebookToken(adAccount.facebookAccessToken);

  if (!token) {
    return {
      error: error || 'Stored Facebook token is invalid. Please reconnect.',
      status: 401,
    };
  }

  return { adAccount, token };
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const adAccountId = searchParams.get('adAccountId');
    const adSetId = searchParams.get('adSetId');

    if (!adAccountId) {
      return NextResponse.json({ error: 'Ad account ID is required' }, { status: 400 });
    }

    if (!adSetId) {
      return NextResponse.json({ error: 'Ad Set ID is required' }, { status: 400 });
    }

    const result = await getAdAccountWithValidation(userId, adAccountId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { adAccount, token } = result;
    const api = new FacebookMarketingAPI(token);

    try {
      const ads = await api.getAds(adSetId);
      return NextResponse.json({ ads });
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
    console.error('Error fetching Facebook ads:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ads' },
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
    const { adAccountId, adSetId, name, status, creative } = body;

    if (!adAccountId || !adSetId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await getAdAccountWithValidation(userId, adAccountId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { adAccount, token } = result;

    const adData: any = {
      adset_id: adSetId,
      name,
      status: status || 'PAUSED',
    };

    if (creative) adData.creative = creative;

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${adSetId}/ads?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to create ad');
    }

    const data = await response.json();
    return NextResponse.json({ success: true, ad: data });
  } catch (error) {
    console.error('Error creating Facebook ad:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create ad' },
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
    const adId = searchParams.get('adId');

    if (!adAccountId || !adId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const result = await getAdAccountWithValidation(userId, adAccountId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { adAccount, token } = result;

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${adId}?access_token=${token}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to delete ad');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Facebook ad:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete ad' },
      { status: 500 }
    );
  }
}
