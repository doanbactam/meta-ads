import { type NextRequest, NextResponse } from 'next/server';
import { syncAllAdAccounts } from '@/lib/server/facebook-sync-service';

/**
 * Cron Job Endpoint for Facebook Data Synchronization
 *
 * This endpoint should be called every 6 hours by a cron service (e.g., Vercel Cron, GitHub Actions)
 * to automatically sync Facebook data to the database.
 *
 * Security: Requires a secret token in the Authorization header to prevent unauthorized access
 *
 * Setup for Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-facebook",
 *     "schedule": "0 *\/6 * * *"
 *   }]
 * }
 *
 * Setup for external cron (e.g., cron-job.org):
 * Schedule: 0 *\/6 * * * (every 6 hours)
 * URL: https://yourdomain.com/api/cron/sync-facebook
 * Headers: Authorization: Bearer YOUR_CRON_SECRET
 */

export const maxDuration = 300; // 5 minutes max execution time
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, verify it
    if (cronSecret) {
      if (!authHeader) {
        console.error('[Cron] Missing authorization header');
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Missing authorization header' },
          { status: 401 }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      if (token !== cronSecret) {
        console.error('[Cron] Invalid cron secret');
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Invalid cron secret' },
          { status: 401 }
        );
      }
    } else {
      console.warn('[Cron] CRON_SECRET not set, endpoint is unprotected!');
    }

    console.log('[Cron] Starting scheduled Facebook data sync...');
    const startTime = Date.now();

    // Sync all ad accounts that need updating
    const result = await syncAllAdAccounts();

    const duration = Date.now() - startTime;
    console.log(
      `[Cron] Sync completed in ${duration}ms: ${result.synced} accounts synced, ${result.errors.length} errors`
    );

    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Sync failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST method for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
