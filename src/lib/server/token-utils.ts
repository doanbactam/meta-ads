import { getDecryptedToken } from './token-encryption';

/**
 * Safely convert a stored Facebook access token into its plaintext form.
 * Handles both encrypted and legacy plain-text tokens.
 */
export function getPlainFacebookToken(
  rawToken: string | null | undefined
): { token: string | null; error?: string } {
  if (!rawToken) {
    return { token: null };
  }

  try {
    const token = getDecryptedToken(rawToken);
    return { token };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to decrypt Facebook access token';
    console.error('[token-utils] Failed to resolve Facebook access token:', error);
    return { token: null, error: message };
  }
}

/**
 * Convenience helper that throws when the token cannot be resolved.
 */
export function requirePlainFacebookToken(
  rawToken: string | null | undefined
): string {
  const { token, error } = getPlainFacebookToken(rawToken);

  if (!token) {
    throw new Error(error || 'Facebook access token is missing or invalid');
  }

  return token;
}
