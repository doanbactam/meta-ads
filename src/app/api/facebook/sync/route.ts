import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';
import { getValidFacebookToken } from '@/lib/server/api/facebook-auth';
import { FacebookSyncService } from '@/lib/server/facebook-sync-service';
import { prisma } from '@/lib/server/prisma';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/app/api/_lib/rate-limiter';

/**
 * Manual Facebook Data Sync Endpoint
 *
 * This endpoint allows users to manually trigger a sync of their Facebook ad data
 * to the database. It's rate-limited to prevent abuse and excessive API calls.
 *
 * Usage: POST /api/facebook/sync?adAccountId=xxx
 */

export const maxDuration = 300; // 5 minutes max execution time

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting (max 5 syncs per hour per user)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const identifier = userId || ip;
    const rateLimitResult = checkRateLimit(identifier, 'facebook_sync', {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many sync requests',
          message: 'You can only sync 5 times per hour. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
      response.headers.set('X-RateLimit-Limit', '5');
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
      return NextResponse.json(
        { error: 'Missing adAccountId parameter' },
        { status: 400 }
      );
    }

    const user = await getOrCreateUserFromClerk(userId);

    // Get ad account and verify ownership
    const adAccount = await prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId: user.id,
      },
    });

    if (!adAccount) {
      return NextResponse.json({ error: 'Ad account not found' }, { status: 404 });
    }

    if (!adAccount.facebookAccessToken || !adAccount.facebookAdAccountId) {
      return NextResponse.json(
        { error: 'Facebook account not connected' },
        { status: 400 }
      );
    }

    // Get valid token (refresh if needed)
    const tokenResult = await getValidFacebookToken(adAccountId, user.id);

    if ('error' in tokenResult) {
      return NextResponse.json(
        {
          error: 'Facebook token invalid',
          message: tokenResult.error,
          needsReconnection: true,
        },
        { status: 401 }
      );
    }

    console.log(`[Manual Sync] Starting sync for ad account ${adAccount.facebookAdAccountId}`);

    // Create sync service and trigger sync
    const syncService = new FacebookSyncService(
      tokenResult.token,
      adAccount.facebookAdAccountId,
      adAccount.id
    );

    // Perform the sync (with force=true to bypass time check)
    const result = await syncService.syncAll({ force: true });

    if (!result.success) {
      console.error('[Manual Sync] Sync failed:', result.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Sync failed',
          message: result.errors.join('; '),
          details: result,
        },
        { status: 500 }
      );
    }

    console.log(
      `[Manual Sync] Completed: ${result.campaigns} campaigns, ${result.adSets} ad sets, ${result.ads} ads`
    );

    return NextResponse.json({
      success: true,
      message: 'Data synchronized successfully',
      synced: {
        campaigns: result.campaigns,
        adSets: result.adSets,
        ads: result.ads,
      },
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Manual Sync] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
