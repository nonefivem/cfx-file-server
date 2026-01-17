interface CacheValue<T = any> {
  data: T;
  timeout: NodeJS.Timeout;
}

class CacheService {
  private readonly cache: Map<string, CacheValue> = new Map();

  set<T = any>(key: string, value: T, ttl: number): void {
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      clearTimeout(existing.timeout);
    }

    const timeout = setTimeout(() => {
      this.cache.delete(key);
    }, ttl);

    this.cache.set(key, { data: value, timeout });
  }

  get<T = any>(key: string): T | null {
    const cached = this.cache.get(key);
    return cached ? (cached.data as T) : null;
  }

  remove(key: string): boolean {
    const cached = this.cache.get(key);
    if (cached) {
      clearTimeout(cached.timeout);
      this.cache.delete(key);
      return true;
    }
    return false;
  }

  exists(key: string): boolean {
    return this.cache.has(key);
  }
}

export type { CacheService };
export const cacheService = new CacheService();
