import { auth } from '@clerk/nextjs/server';
import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/app/api/_lib/rate-limiter';
import { getOrCreateUserFromClerk } from '@/lib/server/api/users';
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';
import { prisma } from '@/lib/server/prisma';
import { encryptTokenForStorage } from '@/lib/server/token-encryption';

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
      'facebook_connect',
      RATE_LIMIT_CONFIGS.facebook_connect
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
        String(RATE_LIMIT_CONFIGS.facebook_connect.maxRequests)
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

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Invalid access token',
          message: validation.error || 'The provided access token is invalid or expired',
        },
        { status: 400 }
      );
    }

    const user = await getOrCreateUserFromClerk(userId);

    const expiryDate = validation.expiresAt
      ? new Date(validation.expiresAt * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    // Fetch ad accounts based on business scope
    let fbAccounts: any[] = [];
    const businessIds = validation.businessIds || [];

    if (businessIds.length > 0) {
      // User granted permission to specific businesses - fetch accounts per business
      console.log(`[Facebook Connect] User granted access to ${businessIds.length} business(es)`);

      for (const businessId of businessIds) {
        try {
          const businessAccounts = await api.getBusinessAdAccounts(businessId);
          fbAccounts.push(...businessAccounts);
          console.log(
            `[Facebook Connect] Found ${businessAccounts.length} accounts for business ${businessId}`
          );
        } catch (error) {
          console.error(
            `[Facebook Connect] Failed to fetch accounts for business ${businessId}:`,
            error
          );
          // Continue with other businesses even if one fails
        }
      }

      // Deduplicate accounts by ID
      const uniqueAccountIds = new Set<string>();
      fbAccounts = fbAccounts.filter((account) => {
        if (uniqueAccountIds.has(account.id)) {
          return false;
        }
        uniqueAccountIds.add(account.id);
        return true;
      });
    } else {
      // Fallback: No business scope detected, use legacy method
      console.log(
        '[Facebook Connect] No business scope detected, using legacy /me/adaccounts endpoint'
      );
      fbAccounts = await api.getUserAdAccounts();
    }

    if (fbAccounts.length === 0) {
      return NextResponse.json(
        {
          error: 'No ad accounts found',
          message:
            'No Facebook ad accounts found for this token. Please ensure you have ad accounts set up in your Facebook Business Manager.',
        },
        { status: 404 }
      );
    }

    console.log(`[Facebook Connect] Total unique accounts found: ${fbAccounts.length}`);

    // Extract authorized account IDs (normalize by removing 'act_' prefix)
    const authorizedAccountIds = fbAccounts.map((acc) => acc.id.replace('act_', ''));

    // Use transaction to ensure data consistency
    let storedToken = accessToken;
    try {
      storedToken = encryptTokenForStorage(accessToken);
    } catch (error) {
      console.warn('[Facebook Connect] Failed to encrypt token, storing as plain text:', error);
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get all existing Facebook ad accounts for this user
      const existingAccounts = await tx.adAccount.findMany({
        where: {
          userId: user.id,
          platform: 'FACEBOOK',
        },
      });

      // Find accounts that are no longer authorized (should be removed)
      const accountsToRemove = existingAccounts.filter(
        (acc) => acc.facebookAdAccountId && !authorizedAccountIds.includes(acc.facebookAdAccountId)
      );

      // Remove unauthorized accounts
      let removedCount = 0;
      if (accountsToRemove.length > 0) {
        const deleteResult = await tx.adAccount.deleteMany({
          where: {
            id: { in: accountsToRemove.map((acc) => acc.id) },
          },
        });
        removedCount = deleteResult.count;
        console.log(`[Facebook Connect] Removed ${removedCount} unauthorized ad accounts`);
      }

      // Upsert all authorized accounts (much faster than loop)
      const upsertPromises = fbAccounts.map((fbAccount) => {
        const cleanAccountId = fbAccount.id.replace('act_', '');

        return tx.adAccount.upsert({
          where: {
            unique_user_facebook_account: {
              userId: user.id,
              facebookAdAccountId: cleanAccountId,
            },
          },
          update: {
            facebookAccessToken: storedToken,
            facebookTokenExpiry: expiryDate,
            facebookUserId: validation.userId,
            facebookBusinessId: fbAccount.businessId || null,
            facebookAccessType: fbAccount.accessType || null,
            name: fbAccount.name,
            currency: fbAccount.currency || 'USD',
            timeZone: fbAccount.timezone || 'UTC',
            status: 'ACTIVE',
          },
          create: {
            userId: user.id,
            name: fbAccount.name,
            platform: 'FACEBOOK',
            status: 'ACTIVE',
            currency: fbAccount.currency || 'USD',
            timeZone: fbAccount.timezone || 'UTC',
            facebookAccessToken: storedToken,
            facebookTokenExpiry: expiryDate,
            facebookAdAccountId: cleanAccountId,
            facebookUserId: validation.userId,
            facebookBusinessId: fbAccount.businessId || null,
            facebookAccessType: fbAccount.accessType || null,
          },
        });
      });

      const updatedAccounts = await Promise.all(upsertPromises);

      return { updatedAccounts, removedCount };
    });

    console.log(`[Facebook Connect] Synchronized ${result.updatedAccounts.length} accounts`);

    // Trigger immediate data sync for the first account (non-blocking)
    if (result.updatedAccounts.length > 0 && result.updatedAccounts[0]) {
      const firstAccount = result.updatedAccounts[0];
      if (firstAccount.facebookAdAccountId) {
        console.log(`[Facebook Connect] Triggering initial data sync for account ${firstAccount.facebookAdAccountId}`);

        // Import sync service dynamically to avoid circular dependencies
        import('@/lib/server/facebook-sync-service').then(({ FacebookSyncService }) => {
          const syncService = new FacebookSyncService(
            accessToken,
            firstAccount.facebookAdAccountId!,
            firstAccount.id
          );

          syncService.syncAll({ force: true }).catch((error) => {
            console.error('[Facebook Connect] Initial sync failed:', error);
          });
        }).catch((error) => {
          console.error('[Facebook Connect] Failed to import sync service:', error);
        });
      }
    }

    return NextResponse.json({
      success: true,
      adAccountId: result.updatedAccounts[0]?.id,
      facebookAdAccountId: result.updatedAccounts[0]?.facebookAdAccountId || undefined,
      tokenExpiry: expiryDate,
      accounts: fbAccounts,
      removedAccounts: result.removedCount,
      message: `Facebook ${result.updatedAccounts.length > 1 ? 'accounts' : 'account'} synchronized successfully. Data sync in progress...`,
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
