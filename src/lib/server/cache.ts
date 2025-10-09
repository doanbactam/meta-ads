import { CacheManager } from './cache-manager';

const sharedCacheManager = new CacheManager();

export function getCacheManager(): CacheManager {
  return sharedCacheManager;
}

