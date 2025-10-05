import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { FacebookSyncService, syncAllAdAccounts } from '@/lib/server/facebook-sync-service';
import { getValidFacebookToken } from '@/lib/server/api/facebook-auth';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';
import { prisma } from '@/lib/server/prisma';

/**
 * Sync API Endpoint
 * 
 * GET /api/sync - Sync all ad accounts (for cron jobs)
 * POST /api/sync - Sync specific ad account (manual trigger)
 * 
 * Usage:
 * - Cron job: curl https://your-domain.com/api/sync?secret=YOUR_CRON_SECRET
 * - Manual: POST /api/sync with body { adAccountId: "xxx", force: true }
 */

// GET - Sync all ad accounts (for cron jobs)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Verify cron secret
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting scheduled sync for all ad accounts...');

    const result = await syncAllAdAccounts();

    return NextResponse.json({
      success: true,
      message: `Synced ${result.synced} ad accounts`,
      synced: result.synced,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Sync endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Sync specific ad account (manual trigger)
export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { adAccountId, force = false } = body;

    if (!adAccountId) {
      return NextResponse.json({ error: 'adAccountId is required' }, { status: 400 });
    }

    const user = await getOrCreateUserFromClerk(clerkId);

    // Get ad account with token
    const adAccount = await prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        userId: user.id,
      },
    });

    if (!adAccount) {
      return NextResponse.json({ error: 'Ad account not found' }, { status: 404 });
    }

    // Validate Facebook token
    const tokenResult = await getValidFacebookToken(adAccountId, user.id);
    if ('error' in tokenResult) {
      return NextResponse.json(
        {
          error: tokenResult.error,
          code: tokenResult.status === 401 ? 'TOKEN_EXPIRED' : 'ERROR',
        },
        { status: tokenResult.status }
      );
    }

    const { token } = tokenResult;

    if (!adAccount.facebookAdAccountId) {
      return NextResponse.json({ error: 'Facebook ad account not configured' }, { status: 400 });
    }

    // Create sync service and run sync
    const syncService = new FacebookSyncService(
      token,
      adAccount.facebookAdAccountId,
      adAccount.id
    );

    const result = await syncService.syncAll({ force });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Sync completed successfully',
        campaigns: result.campaigns,
        adSets: result.adSets,
        ads: result.ads,
        errors: result.errors,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Sync completed with errors',
          campaigns: result.campaigns,
          adSets: result.adSets,
          ads: result.ads,
          errors: result.errors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Manual sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
