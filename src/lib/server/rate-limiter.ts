/**
 * Facebook API Rate Limiting Implementation
 * 
 * Facebook enforces rate limits at multiple levels:
 * - App-level: 200 calls per hour per user
 * - Business-level: Higher limits based on spend
 * - Ad Account-level: Varies based on account tier
 * 
 * Best Practices:
 * 1. Batch requests when possible
 * 2. Cache responses aggressively
 * 3. Use field filtering to reduce payload size
 * 4. Monitor rate limit headers
 * 5. Implement exponential backoff
 * 
 * @see https://developers.facebook.com/docs/graph-api/overview/rate-limiting
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  minInterval?: number; // Minimum time between requests
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

export class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private config: RateLimitConfig;
  private lastRequestTime: Map<string, number> = new Map();

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed under rate limits
   */
  async checkLimit(key: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    const records = this.requests.get(key) || [];

    // Clean up old records outside the window
    const validRecords = records.filter((r) => now - r.timestamp < this.config.windowMs);

    // Check minimum interval between requests
    if (this.config.minInterval) {
      const lastRequest = this.lastRequestTime.get(key);
      if (lastRequest && now - lastRequest < this.config.minInterval) {
        const retryAfter = this.config.minInterval - (now - lastRequest);
        return { allowed: false, retryAfter };
      }
    }

    // Count total requests in window
    const totalRequests = validRecords.reduce((sum, r) => sum + r.count, 0);

    if (totalRequests >= this.config.maxRequests) {
      const oldestRecord = validRecords[0];
      const retryAfter = oldestRecord ? this.config.windowMs - (now - oldestRecord.timestamp) : this.config.windowMs;
      return { allowed: false, retryAfter };
    }

    // Allow request and record it
    validRecords.push({ timestamp: now, count: 1 });
    this.requests.set(key, validRecords);
    this.lastRequestTime.set(key, now);

    return { allowed: true };
  }

  /**
   * Wait for rate limit to allow request
   */
  async waitForLimit(key: string): Promise<void> {
    const check = await this.checkLimit(key);
    if (!check.allowed && check.retryAfter) {
      console.log(`Rate limit reached for ${key}, waiting ${check.retryAfter}ms`);
      await new Promise((resolve) => setTimeout(resolve, check.retryAfter));
      return this.waitForLimit(key); // Retry
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
    this.lastRequestTime.delete(key);
  }

  /**
   * Get current usage stats
   */
  getStats(key: string): { requests: number; windowMs: number; resetAt: number } {
    const now = Date.now();
    const records = this.requests.get(key) || [];
    const validRecords = records.filter((r) => now - r.timestamp < this.config.windowMs);
    const totalRequests = validRecords.reduce((sum, r) => sum + r.count, 0);
    const oldestRecord = validRecords[0];
    const resetAt = oldestRecord ? oldestRecord.timestamp + this.config.windowMs : now;

    return {
      requests: totalRequests,
      windowMs: this.config.windowMs,
      resetAt,
    };
  }
}

// Global rate limiter instances
// App-level: 200 calls per hour (conservative)
export const appRateLimiter = new RateLimiter({
  maxRequests: 180, // Leave buffer
  windowMs: 60 * 60 * 1000, // 1 hour
  minInterval: 100, // 100ms between requests
});

// Per-ad-account rate limiter (more generous)
export const adAccountRateLimiter = new RateLimiter({
  maxRequests: 50,
  windowMs: 60 * 1000, // 1 minute
  minInterval: 50,
});

/**
 * Response cache with TTL
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class ResponseCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();

  /**
   * Get cached data if valid
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache data with TTL
   */
  set(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        entriesToDelete.push(key);
      }
    });
    
    for (const key of entriesToDelete) {
      this.cache.delete(key);
    }
  }
}

// Global caches with different TTLs
export const insightsCache = new ResponseCache<any>(); // 5-15 minutes for insights
export const entityCache = new ResponseCache<any>(); // 1-5 minutes for campaigns/adsets/ads
export const accountCache = new ResponseCache<any>(); // 30 minutes for account data

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  insightsCache.cleanup();
  entityCache.cleanup();
  accountCache.cleanup();
}, 5 * 60 * 1000);
