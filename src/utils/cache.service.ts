import { Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  constructor(
    @Inject(Cache)
    private readonly cacheManager: Cache,
  ) {}

  async setCache(key: string, value: any, ttl: number | 10): Promise<void> {
    await this.cacheManager.set(key, value, ttl); // Set cache with a TTL of 10 seconds
  }

  async getCache(key: string): Promise<any> {
    return await this.cacheManager.get(key); // Get cached value
  }

  async clearCache(key: string): Promise<void> {
    await this.cacheManager.del(key); // Delete specific cache
  }

  async resetCache(): Promise<void> {
    await this.cacheManager.reset(); // Clear all cache
  }
}
