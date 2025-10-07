import { NextRequest, NextResponse } from 'next/server';
import { scheduleTokenRefresh } from '@/lib/server/token-refresh';

/**
 * Cron endpoint for automatic token refresh
 * 
 * This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
 * to proactively refresh tokens that are expiring soon.
 * 
 * Requirements: 8.3 - Add background job to check token expiry
 * 
 * Security: Protected by CRON_SECRET environment variable
 * 
 * Usage:
 * - Set up a cron job to call this endpoint daily
 * - Include Authorization header with CRON_SECRET
 * 
 * Example cron schedule (vercel.json):
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/refresh-tokens",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Invalid cron secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Run token refresh
    console.log('Cron job triggered: Token refresh');
    await scheduleTokenRefresh();
    
    return NextResponse.json({
      success: true,
      message: 'Token refresh completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      {
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
