'use client';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class DataPersistence {
  private prefix = 'ad_manager_cache_';

  // Lưu data vào localStorage với expiration
  set<T>(key: string, data: T, ttlMinutes: number = 10): void {
    try {
      const now = Date.now();
      const item: CacheItem<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttlMinutes * 60 * 1000,
      };

      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  // Lấy data từ localStorage
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const cached: CacheItem<T> = JSON.parse(item);

      // Kiểm tra expiration
      if (Date.now() > cached.expiresAt) {
        this.remove(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }

  // Xóa item
  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  // Xóa tất cả cache expired
  cleanup(): void {
    try {
      const now = Date.now();
      const keys = Object.keys(localStorage);

      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const cached: CacheItem<any> = JSON.parse(item);
              if (now > cached.expiresAt) {
                localStorage.removeItem(key);
              }
            }
          } catch {
            // Invalid item, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error);
    }
  }

  // Lấy cache size
  getCacheSize(): number {
    try {
      let size = 0;
      const keys = Object.keys(localStorage);

      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            size += item.length;
          }
        }
      });

      return size;
    } catch {
      return 0;
    }
  }
}

export const dataPersistence = new DataPersistence();

// Auto cleanup mỗi 30 phút
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      dataPersistence.cleanup();
    },
    30 * 60 * 1000
  );
}
