import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
@Global()
@Module({
  imports: [
    CacheModule.register({
      ttl: 5, // TTL default (dalam detik)
      max: 100, // Jumlah maksimal item dalam cache
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, CacheModule],
})
export class CustomCacheModule {}
