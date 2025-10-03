import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory storage for rate limiting
// In production, use Redis or similar for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Default rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  facebook_api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
  },
  facebook_connect: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5, // 5 connection attempts per 5 minutes
  },
  facebook_validate: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 validation attempts per minute
  },
} as const;

/**
 * Generate a rate limit key based on identifier and endpoint
 */
function getRateLimitKey(identifier: string, endpoint: string): string {
  return `ratelimit:${endpoint}:${identifier}`;
}

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., user ID, IP address)
 * @param endpoint - Endpoint name for rate limiting
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.facebook_api
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const key = getRateLimitKey(identifier, endpoint);
  const now = Date.now();

  // Periodically cleanup expired entries (every 100 requests)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Check if rate limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Middleware function to apply rate limiting to Next.js API routes
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  endpoint: string,
  config?: RateLimitConfig
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Get identifier from request (prefer user ID, fallback to IP)
    const userId = req.headers.get('x-user-id') || req.headers.get('x-clerk-user-id');
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const identifier = userId || ip;

    // Check rate limit
    const rateLimitResult = checkRateLimit(
      identifier,
      endpoint,
      config || RATE_LIMIT_CONFIGS.facebook_api
    );

    // Create response
    const response = rateLimitResult.allowed
      ? await handler(req)
      : NextResponse.json(
          {
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: rateLimitResult.retryAfter,
          },
          { status: 429 }
        );

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', String(config?.maxRequests || RATE_LIMIT_CONFIGS.facebook_api.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

    if (rateLimitResult.retryAfter) {
      response.headers.set('Retry-After', String(rateLimitResult.retryAfter));
    }

    return response;
  };
}

/**
 * Reset rate limit for a specific identifier and endpoint
 */
export function resetRateLimit(identifier: string, endpoint: string): void {
  const key = getRateLimitKey(identifier, endpoint);
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status for an identifier
 */
export function getRateLimitStatus(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.facebook_api
): {
  count: number;
  remaining: number;
  resetTime: number;
} {
  const key = getRateLimitKey(identifier, endpoint);
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry || entry.resetTime < now) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}
