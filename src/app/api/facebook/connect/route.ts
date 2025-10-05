import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/server/prisma';
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/server/rate-limiter';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';

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

    const user = await getOrCreateUserFromClerk(userId);

    const expiryDate = validation.expiresAt
      ? new Date(validation.expiresAt * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    // Fetch all ad accounts authorized by the new token
    const fbAccounts = await api.getUserAdAccounts();

    if (fbAccounts.length === 0) {
      return NextResponse.json({
        error: 'No ad accounts found',
        message: 'No Facebook ad accounts found for this token. Please ensure you have ad accounts set up in your Facebook Business Manager.',
      }, { status: 404 });
    }

    // Get all existing Facebook ad accounts for this user
    const existingAccounts = await prisma.adAccount.findMany({
      where: {
        userId: user.id,
        platform: 'facebook',
      },
    });

    // Extract authorized account IDs (normalize by removing 'act_' prefix)
    const authorizedAccountIds = fbAccounts.map(acc => acc.id.replace('act_', ''));

    // Find accounts that are no longer authorized (should be removed)
    const accountsToRemove = existingAccounts.filter(
      acc => acc.facebookAdAccountId && !authorizedAccountIds.includes(acc.facebookAdAccountId)
    );

    // Remove unauthorized accounts
    if (accountsToRemove.length > 0) {
      await prisma.adAccount.deleteMany({
        where: {
          id: { in: accountsToRemove.map(acc => acc.id) },
        },
      });
      console.log(`Removed ${accountsToRemove.length} unauthorized ad accounts`);
    }

    if (adAccountId) {
      // Specific ad account requested
      const cleanAccountId = adAccountId.replace('act_', '');
      const fbAccount = fbAccounts.find((acc) => acc.id.replace('act_', '') === cleanAccountId);

      if (!fbAccount) {
        return NextResponse.json({
          error: 'Ad account not found',
          message: 'The specified ad account was not found in your Facebook account',
          availableAccounts: fbAccounts.map(acc => ({ id: acc.id, name: acc.name })),
        }, { status: 404 });
      }

      const existingAccount = await prisma.adAccount.findFirst({
        where: {
          userId: user.id,
          facebookAdAccountId: cleanAccountId,
        },
      });

      if (existingAccount) {
        // Overwrite access token for reconnection
        const updated = await prisma.adAccount.update({
          where: { id: existingAccount.id },
          data: {
            facebookAccessToken: accessToken,
            facebookTokenExpiry: expiryDate,
            facebookUserId: validation.userId,
            name: fbAccount.name,
            currency: fbAccount.currency || 'USD',
            timeZone: fbAccount.timezone || 'UTC',
            status: 'active',
          },
        });

        console.log(`[Facebook Connect] Reconnected account ${existingAccount.id}, updatedAt: ${updated.updatedAt}`);

        return NextResponse.json({
          success: true,
          adAccountId: existingAccount.id,
          facebookAdAccountId: cleanAccountId,
          tokenExpiry: expiryDate,
          message: 'Facebook account reconnected successfully',
        });
      }

      // Create new account
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
          facebookAdAccountId: cleanAccountId,
          facebookUserId: validation.userId,
        },
      });

      return NextResponse.json({
        success: true,
        adAccountId: newAccount.id,
        message: 'Facebook account connected successfully',
      });
    }

    // No specific account requested, update or create all authorized accounts
    const updatedAccounts = [];

    for (const fbAccount of fbAccounts) {
      const cleanAccountId = fbAccount.id.replace('act_', '');

      const existingAccount = await prisma.adAccount.findFirst({
        where: {
          userId: user.id,
          facebookAdAccountId: cleanAccountId,
        },
      });

      if (existingAccount) {
        // Overwrite access token for reconnection
        const updated = await prisma.adAccount.update({
          where: { id: existingAccount.id },
          data: {
            facebookAccessToken: accessToken,
            facebookTokenExpiry: expiryDate,
            facebookUserId: validation.userId,
            name: fbAccount.name,
            currency: fbAccount.currency || 'USD',
            timeZone: fbAccount.timezone || 'UTC',
            status: 'active',
          },
        });
        updatedAccounts.push(updated);
      } else {
        // Create new account
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
            facebookAdAccountId: cleanAccountId,
            facebookUserId: validation.userId,
          },
        });
        updatedAccounts.push(newAccount);
      }
    }

    console.log(`[Facebook Connect] Synchronized ${updatedAccounts.length} accounts`);

    return NextResponse.json({
      success: true,
      adAccountId: updatedAccounts[0]?.id,
      facebookAdAccountId: updatedAccounts[0]?.facebookAdAccountId || undefined,
      tokenExpiry: expiryDate,
      accounts: fbAccounts,
      removedAccounts: accountsToRemove.length,
      message: `Facebook ${updatedAccounts.length > 1 ? 'accounts' : 'account'} synchronized successfully`,
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
