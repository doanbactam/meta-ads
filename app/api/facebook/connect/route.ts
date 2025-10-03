import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { FacebookMarketingAPI } from '@/lib/facebook-api';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { accessToken, adAccountId } = body;

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    const api = new FacebookMarketingAPI(accessToken);
    const validation = await api.validateToken();

    if (!validation.isValid) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const expiryDate = validation.expiresAt
      ? new Date(validation.expiresAt * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    if (adAccountId) {
      const existingAccount = await prisma.adAccount.findFirst({
        where: {
          userId: user.id,
          facebookAdAccountId: adAccountId,
        },
      });

      if (existingAccount) {
        await prisma.adAccount.update({
          where: { id: existingAccount.id },
          data: {
            facebookAccessToken: accessToken,
            facebookTokenExpiry: expiryDate,
            status: 'active',
          },
        });

        return NextResponse.json({
          success: true,
          adAccountId: existingAccount.id,
          message: 'Facebook account updated successfully',
        });
      }

      const fbAccounts = await api.getUserAdAccounts();
      const fbAccount = fbAccounts.find((acc) => acc.id === adAccountId || acc.id === `act_${adAccountId}`);

      if (!fbAccount) {
        return NextResponse.json({ error: 'Ad account not found' }, { status: 404 });
      }

      const newAccount = await prisma.adAccount.create({
        data: {
          userId: user.id,
          name: fbAccount.name,
          platform: 'facebook',
          status: 'active',
          currency: fbAccount.currency || 'USD',
          timeZone: fbAccount.timezone || 'UTC',
          facebookAccessToken: accessToken,
          facebookTokenExpiry: expiryDate,
          facebookAdAccountId: adAccountId,
        },
      });

      return NextResponse.json({
        success: true,
        adAccountId: newAccount.id,
        message: 'Facebook account connected successfully',
      });
    }

    const fbAccounts = await api.getUserAdAccounts();

    if (fbAccounts.length === 0) {
      return NextResponse.json({ error: 'No ad accounts found' }, { status: 404 });
    }

    const firstAccount = fbAccounts[0];
    const cleanAccountId = firstAccount.id.replace('act_', '');

    const existingAccount = await prisma.adAccount.findFirst({
      where: {
        userId: user.id,
        facebookAdAccountId: cleanAccountId,
      },
    });

    if (existingAccount) {
      await prisma.adAccount.update({
        where: { id: existingAccount.id },
        data: {
          facebookAccessToken: accessToken,
          facebookTokenExpiry: expiryDate,
          status: 'active',
        },
      });

      return NextResponse.json({
        success: true,
        adAccountId: existingAccount.id,
        accounts: fbAccounts,
        message: 'Facebook account updated successfully',
      });
    }

    const newAccount = await prisma.adAccount.create({
      data: {
        userId: user.id,
        name: firstAccount.name,
        platform: 'facebook',
        status: 'active',
        currency: firstAccount.currency || 'USD',
        timeZone: firstAccount.timezone || 'UTC',
        facebookAccessToken: accessToken,
        facebookTokenExpiry: expiryDate,
        facebookAdAccountId: cleanAccountId,
      },
    });

    return NextResponse.json({
      success: true,
      adAccountId: newAccount.id,
      accounts: fbAccounts,
      message: 'Facebook account connected successfully',
    });
  } catch (error) {
    console.error('Error connecting Facebook account:', error);
    return NextResponse.json(
      { error: 'Failed to connect Facebook account' },
      { status: 500 }
    );
  }
}
