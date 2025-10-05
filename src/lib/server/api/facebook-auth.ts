import { prisma } from '@/lib/server/prisma';
import { FacebookMarketingAPI } from '@/lib/server/facebook-api';
import { AdAccount } from '@prisma/client';

/**
 * Validates and returns a Facebook access token for an ad account.
 * Returns null if token is expired or invalid.
 * Automatically marks accounts with expired tokens as paused.
 */
export async function getValidFacebookToken(
  adAccountId: string,
  userId: string
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

  // Check if token is expired based on stored expiry date
  if (adAccount.facebookTokenExpiry && adAccount.facebookTokenExpiry < new Date()) {
    // Mark account as paused
    await prisma.adAccount.update({
      where: { id: adAccount.id },
      data: { status: 'paused' },
    });

    return { error: 'Facebook token expired. Please reconnect your account.', status: 401 };
  }

  // Validate token with Facebook API
  const api = new FacebookMarketingAPI(adAccount.facebookAccessToken);
  const validation = await api.validateToken();

  if (!validation.isValid) {
    // Mark account as paused and update token expiry to now
    await prisma.adAccount.update({
      where: { id: adAccount.id },
      data: {
        status: 'paused',
        facebookTokenExpiry: new Date(),
      },
    });

    return { error: validation.error || 'Facebook token is invalid. Please reconnect.', status: 401 };
  }

  return { token: adAccount.facebookAccessToken, adAccount };
}

/**
 * Checks if Facebook token is expired for an error response
 */
export function isFacebookTokenExpiredError(error: any): boolean {
  if (!error) return false;

  // Handle case where error is a string
  const errorMessage = typeof error === 'string'
    ? error
    : (error.message || error.error || '');
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
export async function handleFacebookTokenError(
  adAccountId: string,
  error: any
): Promise<void> {
  if (isFacebookTokenExpiredError(error)) {
    await prisma.adAccount.update({
      where: { id: adAccountId },
      data: {
        status: 'paused',
        facebookTokenExpiry: new Date(),
      },
    });
  }
}
