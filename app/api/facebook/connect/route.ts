import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { FacebookMarketingAPI } from '@/lib/facebook-api';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const identifier = userId || ip;
    const rateLimitResult = checkRateLimit(identifier, 'facebook_connect', RATE_LIMIT_CONFIGS.facebook_connect);

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
      response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_CONFIGS.facebook_connect.maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
      if (rateLimitResult.retryAfter) {
        response.headers.set('Retry-After', String(rateLimitResult.retryAfter));
      }
      return response;
    }

    const body = await req.json();
    const { accessToken, adAccountId } = body;

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    const api = new FacebookMarketingAPI(accessToken);
    const validation = await api.validateToken();

    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Invalid access token',
        message: validation.error || 'The provided access token is invalid or expired',
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({
        error: 'User not found',
        message: 'User account not found in database',
      }, { status: 404 });
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
        return NextResponse.json({
          error: 'Ad account not found',
          message: 'The specified ad account was not found in your Facebook account',
          availableAccounts: fbAccounts.map(acc => ({ id: acc.id, name: acc.name })),
        }, { status: 404 });
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
      return NextResponse.json({
        error: 'No ad accounts found',
        message: 'No Facebook ad accounts found for this token. Please ensure you have ad accounts set up in your Facebook Business Manager.',
      }, { status: 404 });
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        error: 'Failed to connect Facebook account',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
