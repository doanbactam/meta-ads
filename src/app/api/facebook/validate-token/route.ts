import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/server/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const identifier = userId || ip;
    const rateLimitResult = checkRateLimit(
      identifier,
      'facebook_validate',
      RATE_LIMIT_CONFIGS.facebook_validate
    );

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
      response.headers.set(
        'X-RateLimit-Limit',
        String(RATE_LIMIT_CONFIGS.facebook_validate.maxRequests)
      );
      response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
      if (rateLimitResult.retryAfter) {
        response.headers.set('Retry-After', String(rateLimitResult.retryAfter));
      }
      return response;
    }

    const body = await req.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    const api = new FacebookMarketingAPI(accessToken);
    const validation = await api.validateToken();

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Error validating Facebook token:', error);
    return NextResponse.json({ error: 'Failed to validate token' }, { status: 500 });
  }
}
