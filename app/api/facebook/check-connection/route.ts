import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { FacebookMarketingAPI } from '@/lib/facebook-api';

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

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const adAccount = await prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId: user.id,
      },
    });

    if (!adAccount) {
      return NextResponse.json({ connected: false, error: 'Ad account not found' }, { status: 404 });
    }

    if (!adAccount.facebookAccessToken) {
      return NextResponse.json({ connected: false, message: 'No Facebook token found' });
    }

    if (adAccount.facebookTokenExpiry && adAccount.facebookTokenExpiry < new Date()) {
      return NextResponse.json({ connected: false, message: 'Token expired' });
    }

    const api = new FacebookMarketingAPI(adAccount.facebookAccessToken);
    const validation = await api.validateToken();

    if (!validation.isValid) {
      return NextResponse.json({ connected: false, message: 'Token is invalid' });
    }

    return NextResponse.json({
      connected: true,
      adAccountId: adAccount.id,
      facebookAdAccountId: adAccount.facebookAdAccountId,
      tokenExpiry: adAccount.facebookTokenExpiry,
    });
  } catch (error) {
    console.error('Error checking Facebook connection:', error);
    return NextResponse.json(
      { connected: false, error: 'Failed to check connection' },
      { status: 500 }
    );
  }
}
