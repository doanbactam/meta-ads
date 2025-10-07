import { CACHE_CONFIG, CACHE_TTL } from "./config/facebook";
import type {
  FacebookAdAccountData,
  FacebookAdData,
  FacebookAdSetData,
  FacebookCampaignData,
  FacebookInsightsData,
} from "@/types/facebook-api";

// ============================================================================
// TYPES
// ============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

type EntityType = "adAccount" | "campaign" | "adSet" | "ad" | "insights";

interface CacheStats {
  size: number;
  maxSize: number;
  expired: number;
  active: number;
  hitRate?: number;
  missRate?: number;
  totalHits?: number;
  totalMisses?: number;
}

// ============================================================================
// CACHE MANAGER
// ============================================================================

/**
 * CacheManager - In-memory LRU cache với TTL support
 * 
 * Implements Least Recently Used (LRU) eviction policy với per-entity TTL configuration.
 * Tự động handle expiration và provide entity-specific cache methods.
 * 
 * Features:
 * - LRU (Least Recently Used) eviction policy
 * - Per-entity TTL configuration (Ad Account: 30m, Campaign/AdSet/Ad: 5m, Insights: 10m)
 * - Generic type-safe operations
 * - Automatic expiration handling
 * - Pattern-based invalidation
 * - Cache statistics tracking
 * - Cache warming support
 * 
 * @example
 * ```typescript
 * const cache = new CacheManager(1000); // Max 1000 entries
 * 
 * // Cache campaigns
 * cache.setCampaigns(userId, accountId, campaigns);
 * 
 * // Get from cache
 * const cached = cache.getCampaigns(userId, accountId);
 * 
 * // Invalidate cache
 * cache.invalidateCampaigns(userId, accountId);
 * 
 * // Get statistics
 * const stats = cache.getStats();
 * console.log('Hit rate:', stats.hitRate);
 * ```
 * 
 * @see {@link CACHE_CONFIG} for default configuration
 * @see {@link CACHE_TTL} for TTL values
 */
export class CacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private readonly maxSize: number;
  private readonly ttls: typeof CACHE_TTL;
  private stats: {
    hits: number;
    misses: number;
  };

  constructor(maxSize: number = CACHE_CONFIG.maxSize) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttls = CACHE_TTL;
    this.stats = {
      hits: 0,
      misses: 0,
    };
  }

  /**
   * Get value từ cache
   * 
   * Tự động check expiration và update last accessed time cho LRU.
   * Increment hit/miss statistics.
   * 
   * @template T - Type of cached value
   * @param {string} key - Cache key
   * @returns {T | null} Cached value hoặc null nếu không tồn tại/expired
   * 
   * @example
   * ```typescript
   * const campaigns = cache.get<FacebookCampaignData[]>('user123:campaign:act_123');
   * if (campaigns) {
   *   console.log('Cache hit:', campaigns.length);
   * }
   * ```
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update last accessed time for LRU
    entry.lastAccessed = Date.now();
    this.cache.set(key, entry);
    this.stats.hits++;

    return entry.value as T;
  }

  /**
   * Set value vào cache với TTL dựa trên entity type
   * 
   * Tự động evict LRU entry nếu cache đầy.
   * TTL được determine bởi entity type (adAccount: 30m, campaign: 5m, etc.)
   * 
   * @template T - Type of value to cache
   * @param {string} key - Cache key
   * @param {T} value - Value to cache
   * @param {EntityType} entityType - Entity type để determine TTL
   * 
   * @example
   * ```typescript
   * cache.set('user123:campaign:act_123', campaigns, 'campaign');
   * ```
   */
  set<T>(key: string, value: T, entityType: EntityType): void {
    const ttl = this.ttls[entityType];
    const now = Date.now();

    const entry: CacheEntry<T> = {
      value,
      expiresAt: now + ttl,
      lastAccessed: now,
    };

    // If cache is full, evict least recently used entry
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Number.POSITIVE_INFINITY;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up tất cả expired entries
   * 
   * Nên được gọi periodically (e.g., mỗi 5 phút) để free up memory.
   * 
   * @returns {number} Số entries đã được cleaned up
   * 
   * @example
   * ```typescript
   * // Run cleanup every 5 minutes
   * setInterval(() => {
   *   const cleaned = cache.cleanupExpired();
   *   console.log('Cleaned', cleaned, 'expired entries');
   * }, 5 * 60 * 1000);
   * ```
   */
  cleanupExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get cache statistics
   * 
   * Provides insights về cache performance including hit rate, size, và expired entries.
   * 
   * @returns {CacheStats} Cache statistics
   * @returns {number} CacheStats.size - Total entries trong cache
   * @returns {number} CacheStats.maxSize - Max cache size
   * @returns {number} CacheStats.expired - Số entries đã expired
   * @returns {number} CacheStats.active - Số entries còn valid
   * @returns {number} CacheStats.hitRate - Cache hit rate (0-1)
   * @returns {number} CacheStats.missRate - Cache miss rate (0-1)
   * @returns {number} CacheStats.totalHits - Total cache hits
   * @returns {number} CacheStats.totalMisses - Total cache misses
   * 
   * @example
   * ```typescript
   * const stats = cache.getStats();
   * console.log('Cache performance:');
   * console.log('- Hit rate:', (stats.hitRate * 100).toFixed(2) + '%');
   * console.log('- Size:', stats.active, '/', stats.maxSize);
   * console.log('- Expired:', stats.expired);
   * ```
   */
  getStats(): CacheStats {
    const now = Date.now();
    let expired = 0;

    const values = Array.from(this.cache.values());
    for (const entry of values) {
      if (now > entry.expiresAt) {
        expired++;
      }
    }

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      active: this.cache.size - expired,
      hitRate,
      missRate,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
    };
  }

  // ============================================================================
  // ENTITY-SPECIFIC CACHE METHODS
  // ============================================================================

  /**
   * Generate cache key for entity
   */
  private generateKey(
    userId: string,
    entityType: EntityType,
    entityId: string,
  ): string {
    return `${userId}:${entityType}:${entityId}`;
  }

  /**
   * Generate cache key pattern for invalidation
   */
  private generatePattern(
    userId: string,
    entityType: EntityType,
    entityId?: string,
  ): string {
    if (entityId) {
      return `${userId}:${entityType}:${entityId}`;
    }
    return `${userId}:${entityType}:`;
  }

  // ============================================================================
  // CAMPAIGNS
  // ============================================================================

  /**
   * Get campaigns from cache
   */
  getCampaigns(
    userId: string,
    accountId: string,
  ): FacebookCampaignData[] | null {
    const key = this.generateKey(userId, "campaign", accountId);
    return this.get<FacebookCampaignData[]>(key);
  }

  /**
   * Set campaigns in cache
   */
  setCampaigns(
    userId: string,
    accountId: string,
    campaigns: FacebookCampaignData[],
  ): void {
    const key = this.generateKey(userId, "campaign", accountId);
    this.set(key, campaigns, "campaign");
  }

  /**
   * Invalidate campaigns cache
   */
  invalidateCampaigns(userId: string, accountId?: string): void {
    if (accountId) {
      const key = this.generateKey(userId, "campaign", accountId);
      this.delete(key);
    } else {
      // Invalidate all campaigns for user
      const pattern = this.generatePattern(userId, "campaign");
      this.invalidatePattern(pattern);
    }
  }

  // ============================================================================
  // AD SETS
  // ============================================================================

  /**
   * Get ad sets from cache
   */
  getAdSets(userId: string, campaignId: string): FacebookAdSetData[] | null {
    const key = this.generateKey(userId, "adSet", campaignId);
    return this.get<FacebookAdSetData[]>(key);
  }

  /**
   * Set ad sets in cache
   */
  setAdSets(
    userId: string,
    campaignId: string,
    adSets: FacebookAdSetData[],
  ): void {
    const key = this.generateKey(userId, "adSet", campaignId);
    this.set(key, adSets, "adSet");
  }

  /**
   * Invalidate ad sets cache
   */
  invalidateAdSets(userId: string, campaignId?: string): void {
    if (campaignId) {
      const key = this.generateKey(userId, "adSet", campaignId);
      this.delete(key);
    } else {
      // Invalidate all ad sets for user
      const pattern = this.generatePattern(userId, "adSet");
      this.invalidatePattern(pattern);
    }
  }

  // ============================================================================
  // ADS
  // ============================================================================

  /**
   * Get ads from cache
   */
  getAds(userId: string, adSetId: string): FacebookAdData[] | null {
    const key = this.generateKey(userId, "ad", adSetId);
    return this.get<FacebookAdData[]>(key);
  }

  /**
   * Set ads in cache
   */
  setAds(userId: string, adSetId: string, ads: FacebookAdData[]): void {
    const key = this.generateKey(userId, "ad", adSetId);
    this.set(key, ads, "ad");
  }

  /**
   * Invalidate ads cache
   */
  invalidateAds(userId: string, adSetId?: string): void {
    if (adSetId) {
      const key = this.generateKey(userId, "ad", adSetId);
      this.delete(key);
    } else {
      // Invalidate all ads for user
      const pattern = this.generatePattern(userId, "ad");
      this.invalidatePattern(pattern);
    }
  }

  // ============================================================================
  // INSIGHTS
  // ============================================================================

  /**
   * Get insights from cache
   */
  getInsights(
    userId: string,
    entityId: string,
    dateRange?: string,
  ): FacebookInsightsData | null {
    const cacheId = dateRange ? `${entityId}:${dateRange}` : entityId;
    const key = this.generateKey(userId, "insights", cacheId);
    return this.get<FacebookInsightsData>(key);
  }

  /**
   * Set insights in cache
   */
  setInsights(
    userId: string,
    entityId: string,
    insights: FacebookInsightsData,
    dateRange?: string,
  ): void {
    const cacheId = dateRange ? `${entityId}:${dateRange}` : entityId;
    const key = this.generateKey(userId, "insights", cacheId);
    this.set(key, insights, "insights");
  }

  /**
   * Invalidate insights cache
   */
  invalidateInsights(userId: string, entityId?: string): void {
    if (entityId) {
      // Invalidate all insights for this entity (all date ranges)
      const pattern = this.generatePattern(userId, "insights", entityId);
      this.invalidatePattern(pattern);
    } else {
      // Invalidate all insights for user
      const pattern = this.generatePattern(userId, "insights");
      this.invalidatePattern(pattern);
    }
  }

  // ============================================================================
  // AD ACCOUNTS
  // ============================================================================

  /**
   * Get ad accounts from cache
   */
  getAdAccounts(userId: string): FacebookAdAccountData[] | null {
    const key = this.generateKey(userId, "adAccount", "all");
    return this.get<FacebookAdAccountData[]>(key);
  }

  /**
   * Set ad accounts in cache
   */
  setAdAccounts(
    userId: string,
    adAccounts: FacebookAdAccountData[],
  ): void {
    const key = this.generateKey(userId, "adAccount", "all");
    this.set(key, adAccounts, "adAccount");
  }

  /**
   * Invalidate ad accounts cache
   */
  invalidateAdAccounts(userId: string): void {
    const pattern = this.generatePattern(userId, "adAccount");
    this.invalidatePattern(pattern);
  }

  // ============================================================================
  // PATTERN-BASED INVALIDATION
  // ============================================================================

  /**
   * Invalidate tất cả cache entries matching pattern
   * 
   * Sử dụng string prefix matching để invalidate multiple related entries.
   * Useful cho invalidating tất cả campaigns của một user.
   * 
   * @param {string} pattern - Pattern để match (prefix matching)
   * @returns {number} Số entries đã được invalidated
   * 
   * @example
   * ```typescript
   * // Invalidate all campaigns for user
   * const count = cache.invalidatePattern('user123:campaign:');
   * console.log('Invalidated', count, 'campaign entries');
   * 
   * // Invalidate all cache for user
   * cache.invalidatePattern('user123:');
   * ```
   */
  invalidatePattern(pattern: string): number {
    let invalidated = 0;
    const keys = Array.from(this.cache.keys());

    for (const key of keys) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  // ============================================================================
  // CACHE WARMING
  // ============================================================================

  /**
   * Warm cache với frequently accessed data
   * 
   * Pre-populate cache với data đã fetch từ API để improve initial load performance.
   * Nên được gọi sau khi user login hoặc khi sync data từ Facebook.
   * 
   * @param {string} userId - User ID
   * @param {Object} data - Data to cache
   * @param {FacebookAdAccountData[]} [data.adAccounts] - Ad accounts to cache
   * @param {Map<string, FacebookCampaignData[]>} [data.campaigns] - Campaigns by account ID
   * @param {Map<string, FacebookAdSetData[]>} [data.adSets] - Ad sets by campaign ID
   * @param {Map<string, FacebookAdData[]>} [data.ads] - Ads by ad set ID
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * // After fetching data from API
   * await cache.warmCache(userId, {
   *   adAccounts: accounts,
   *   campaigns: new Map([
   *     ['act_123', campaigns1],
   *     ['act_456', campaigns2]
   *   ]),
   *   adSets: new Map([
   *     ['campaign_123', adSets1]
   *   ])
   * });
   * ```
   */
  async warmCache(
    userId: string,
    data: {
      adAccounts?: FacebookAdAccountData[];
      campaigns?: Map<string, FacebookCampaignData[]>;
      adSets?: Map<string, FacebookAdSetData[]>;
      ads?: Map<string, FacebookAdData[]>;
    },
  ): Promise<void> {
    // Cache ad accounts
    if (data.adAccounts) {
      this.setAdAccounts(userId, data.adAccounts);
    }

    // Cache campaigns
    if (data.campaigns) {
      const campaignEntries = Array.from(data.campaigns.entries());
      for (const [accountId, campaigns] of campaignEntries) {
        this.setCampaigns(userId, accountId, campaigns);
      }
    }

    // Cache ad sets
    if (data.adSets) {
      const adSetEntries = Array.from(data.adSets.entries());
      for (const [campaignId, adSets] of adSetEntries) {
        this.setAdSets(userId, campaignId, adSets);
      }
    }

    // Cache ads
    if (data.ads) {
      const adEntries = Array.from(data.ads.entries());
      for (const [adSetId, ads] of adEntries) {
        this.setAds(userId, adSetId, ads);
      }
    }
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
    };
  }
}