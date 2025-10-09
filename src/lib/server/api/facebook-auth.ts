import type { AdAccount } from '@prisma/client';
import { FacebookMarketingAPI, FacebookTokenExpiredError } from '@/lib/server/facebook-api';
import { prisma } from '@/lib/server/prisma';
import { getPlainFacebookToken } from '@/lib/server/token-utils';

/**
 * Validates and returns a Facebook access token for an ad account.
 * Returns null if token is expired or invalid.
 * Automatically marks accounts with expired tokens as paused.
 */
export async function getValidFacebookToken(
  adAccountId: string,
  userId: string,
  options?: { skipFacebookValidation?: boolean }
): Promise<{ token: string; adAccount: AdAccount } | { error: string; status: number }> {
  const adAccount = await prisma.adAccount.findFirst({
    where: {
      id: adAccountId,
      userId: userId,
    },
  });

  if (!adAccount) {
    return { error: 'Ad account not found', status: 404 };
  }

  if (!adAccount.facebookAccessToken || !adAccount.facebookAdAccountId) {
    return { error: 'Facebook not connected', status: 400 };
  }

  const { token: plainToken, error: decodeError } = getPlainFacebookToken(
    adAccount.facebookAccessToken
  );

  if (!plainToken) {
    await prisma.adAccount.update({
      where: { id: adAccount.id },
      data: {
        status: 'PAUSED',
        syncStatus: 'ERROR',
        syncError: decodeError || 'Stored Facebook token is invalid. Please reconnect.',
        facebookTokenExpiry: new Date(),
      },
    });

    return {
      error: decodeError || 'Facebook token is invalid. Please reconnect.',
      status: 401,
    };
  }

  // Check if token is expired based on stored expiry date
  if (adAccount.facebookTokenExpiry && adAccount.facebookTokenExpiry < new Date()) {
    // Mark account as paused using transaction to prevent race conditions
    await prisma.$transaction(async (tx) => {
      const current = await tx.adAccount.findUnique({
        where: { id: adAccount.id },
        select: { status: true },
      });
      if (current?.status !== 'PAUSED') {
        await tx.adAccount.update({
          where: { id: adAccount.id },
          data: { status: 'PAUSED' },
        });
      }
    });

    return { error: 'Facebook token expired. Please reconnect your account.', status: 401 };
  }

  // Skip Facebook API validation if requested (e.g., token was just updated)
  // This prevents race conditions and unnecessary API calls after reconnection
  if (options?.skipFacebookValidation) {
    return { token: plainToken, adAccount };
  }

  // Check if token was recently updated (within last 2 minutes)
  // If so, trust the stored token without re-validating with Facebook
  const recentlyUpdated =
    adAccount.updatedAt && Date.now() - adAccount.updatedAt.getTime() < 2 * 60 * 1000;

  if (recentlyUpdated && adAccount.status === 'ACTIVE') {
    return { token: plainToken, adAccount };
  }

  // Validate token with Facebook API
  const api = new FacebookMarketingAPI(plainToken);
  const validation = await api.validateToken();

  if (!validation.isValid) {
    // Mark account as paused and update token expiry using transaction
    await prisma.$transaction(async (tx) => {
      const current = await tx.adAccount.findUnique({
        where: { id: adAccount.id },
        select: { status: true },
      });
      if (current?.status !== 'PAUSED') {
        await tx.adAccount.update({
          where: { id: adAccount.id },
          data: {
            status: 'PAUSED',
            facebookTokenExpiry: new Date(),
          },
        });
      }
    });

    return {
      error: validation.error || 'Facebook token is invalid. Please reconnect.',
      status: 401,
    };
  }

  return { token: plainToken, adAccount };
}

/**
 * Checks if Facebook token is expired for an error response
 */
export function isFacebookTokenExpiredError(error: any): boolean {
  if (!error) return false;

  // Check for typed error first
  if (error instanceof FacebookTokenExpiredError) return true;

  // Handle case where error is a string
  const errorMessage = typeof error === 'string' ? error : error.message || error.error || '';
  const errorCode = error.code;

  return (
    errorMessage.includes('Session has expired') ||
    errorMessage.includes('access token') ||
    errorMessage.includes('token is invalid') ||
    errorMessage.includes('Error validating access token') ||
    errorMessage === 'FACEBOOK_TOKEN_EXPIRED' ||
    errorCode === 190 // Invalid OAuth 2.0 Access Token
  );
}

/**
 * Handles Facebook API errors and marks account as inactive if token expired
 */
export async function handleFacebookTokenError(adAccountId: string, error: any): Promise<void> {
  if (isFacebookTokenExpiredError(error)) {
    await prisma.adAccount.update({
      where: { id: adAccountId },
      data: {
        status: 'PAUSED',
        facebookTokenExpiry: new Date(),
      },
    });
  }
}
