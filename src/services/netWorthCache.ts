import { NetWorthData } from './netWorthService';

interface NetWorthCacheEntry {
  data: NetWorthData;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class NetWorthCache {
  private cache: Map<string, NetWorthCacheEntry> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generates a cache key for a user's net worth data
   */
  private getCacheKey(userId: string): string {
    return `networth:${userId}`;
  }

  /**
   * Stores net worth data in cache
   */
  set(userId: string, data: NetWorthData, ttl: number = this.DEFAULT_TTL): void {
    const key = this.getCacheKey(userId);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Retrieves net worth data from cache if valid
   */
  get(userId: string): NetWorthData | null {
    const key = this.getCacheKey(userId);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Invalidates cache for a specific user
   */
  invalidate(userId: string): void {
    const key = this.getCacheKey(userId);
    this.cache.delete(key);
  }

  /**
   * Invalidates all cache entries
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
  } {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
    };
  }

  /**
   * Cleans up expired cache entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Warms the cache for a user with fresh data
   */
  async warm(userId: string, dataProvider: () => Promise<NetWorthData>): Promise<NetWorthData> {
    try {
      const data = await dataProvider();
      this.set(userId, data);
      return data;
    } catch (error) {
      throw error;
    }
  }
}

// Create a singleton instance
export const netWorthCache = new NetWorthCache();

// Cache invalidation triggers - call these when underlying data changes
export class NetWorthCacheInvalidator {
  /**
   * Invalidate cache when assets change
   */
  static onAssetChange(userId: string): void {
    netWorthCache.invalidate(userId);
  }

  /**
   * Invalidate cache when liabilities change
   */
  static onLiabilityChange(userId: string): void {
    netWorthCache.invalidate(userId);
  }

  /**
   * Invalidate cache when account balances update
   */
  static onAccountBalanceUpdate(userId: string): void {
    netWorthCache.invalidate(userId);
  }

  /**
   * Invalidate cache when manual refresh is requested
   */
  static onManualRefresh(userId: string): void {
    netWorthCache.invalidate(userId);
  }
}

// Set up periodic cleanup (every 10 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    netWorthCache.cleanup();
  }, 10 * 60 * 1000);
}