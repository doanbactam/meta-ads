import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { FacebookMarketingAPI } from '@/lib/facebook-api';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter';
import { getOrCreateUserFromClerk } from '@/lib/api/users';

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
