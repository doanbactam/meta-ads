import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/server/prisma';
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/server/rate-limiter';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const identifier = userId || ip;
    const rateLimitResult = checkRateLimit(identifier, 'facebook_api', RATE_LIMIT_CONFIGS.facebook_api);

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
      response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_CONFIGS.facebook_api.maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
      if (rateLimitResult.retryAfter) {
        response.headers.set('Retry-After', String(rateLimitResult.retryAfter));
      }
      return response;
    }

    const { searchParams } = new URL(req.url);
    const adAccountId = searchParams.get('adAccountId');

    if (!adAccountId) {
      return NextResponse.json({ error: 'Ad account ID is required' }, { status: 400 });
    }

    const user = await getOrCreateUserFromClerk(userId);

    const adAccount = await prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId: user.id,
      },
    });

    if (!adAccount) {
      return NextResponse.json({
        connected: false,
        error: 'Ad account not found',
        requiresReconnect: true,
        reason: 'AD_ACCOUNT_NOT_FOUND'
      }, { status: 404 });
    }

    if (!adAccount.facebookAccessToken) {
      return NextResponse.json({
        connected: false,
        message: 'No Facebook token found',
        requiresReconnect: true,
        reason: 'TOKEN_MISSING'
      });
    }

    // Check if token is expired based on stored expiry
    if (adAccount.facebookTokenExpiry && adAccount.facebookTokenExpiry < new Date()) {
      // Mark account as inactive
      await prisma.adAccount.update({
        where: { id: adAccount.id },
        data: { status: 'paused' },
      });

      return NextResponse.json({
        connected: false,
        message: 'Token expired',
        requiresReconnect: true,
        reason: 'TOKEN_EXPIRED',
        expiredAt: adAccount.facebookTokenExpiry
      });
    }

    // If token was recently updated (within last 2 minutes) and status is active,
    // skip Facebook API validation to prevent race conditions and unnecessary API calls
    const recentlyUpdated = adAccount.updatedAt && 
      new Date().getTime() - adAccount.updatedAt.getTime() < 2 * 60 * 1000;

    if (recentlyUpdated && adAccount.status === 'active') {
      // Token was just updated, trust it without re-validating
      console.log(`[Check Connection] Skipping validation for recently updated account ${adAccount.id}`);
      return NextResponse.json({
        connected: true,
        adAccountId: adAccount.id,
        facebookAdAccountId: adAccount.facebookAdAccountId,
        tokenExpiry: adAccount.facebookTokenExpiry,
        tokenExpiryWarning: false,
        scopes: [],
      });
    }

    // Validate token with Facebook API
    const api = new FacebookMarketingAPI(adAccount.facebookAccessToken);
    const validation = await api.validateToken();

    if (!validation.isValid) {
      // Mark account as inactive
      await prisma.adAccount.update({
        where: { id: adAccount.id },
        data: { status: 'paused' },
      });

      return NextResponse.json({
        connected: false,
        message: validation.error || 'Token is invalid',
        requiresReconnect: true,
        reason: 'TOKEN_INVALID',
        errorDetails: validation.error
      });
    }

    // Check if token is about to expire (within 7 days)
    const tokenExpiryWarning = validation.expiresAt
      ? new Date(validation.expiresAt * 1000) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      : false;

    return NextResponse.json({
      connected: true,
      adAccountId: adAccount.id,
      facebookAdAccountId: adAccount.facebookAdAccountId,
      tokenExpiry: adAccount.facebookTokenExpiry,
      tokenExpiryWarning,
      scopes: validation.scopes,
    });
  } catch (error) {
    console.error('Error checking Facebook connection:', error);
    return NextResponse.json(
      {
        connected: false,
        error: 'Failed to check connection',
        requiresReconnect: true,
        reason: 'CONNECTION_ERROR'
      },
      { status: 500 }
    );
  }
}
