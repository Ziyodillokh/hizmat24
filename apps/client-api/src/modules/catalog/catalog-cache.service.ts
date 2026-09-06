import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@client/infra/redis/redis.module';
import type { AppEnv } from '@client/infra/config/env.validation';

/** Admin panel katalogni o'zgartirganda shu kanalga xabar yuboradi (TZ 3.2). */
export const CATALOG_INVALIDATION_CHANNEL = 'service-categories:invalidate';

export const CATALOG_CACHE_KEYS = {
  categories: 'service-categories:active',
  groups: 'service-groups:active',
} as const;

const CACHE_TTL_SECONDS = 300;

/**
 * Katalog cache'ining yagona egasi.
 *
 * Guruhlar va kategoriyalar bitta manbadan (admin panel) o'zgaradi, shuning
 * uchun bitta pub/sub obunachi ikkala kalitni ham tozalaydi — har bir servis
 * o'zining alohida ulanishini ochib o'tirmaydi.
 */
@Injectable()
export class CatalogCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CatalogCacheService.name);
  private subscriber?: Redis;

  constructor(
    private readonly config: ConfigService<AppEnv, true>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async onModuleInit(): Promise<void> {
    this.subscriber = new Redis({
      host: this.config.get('REDIS_HOST', { infer: true }),
      port: this.config.get('REDIS_PORT', { infer: true }),
      password: this.config.get('REDIS_PASSWORD', { infer: true }),
      db: this.config.get('REDIS_DB', { infer: true }),
      maxRetriesPerRequest: null,
    });

    await this.subscriber.subscribe(CATALOG_INVALIDATION_CHANNEL);
    this.subscriber.on('message', (channel) => {
      if (channel === CATALOG_INVALIDATION_CHANNEL) {
        void this.invalidateAll();
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.subscriber?.quit();
  }

  /** Cache'dan o'qiydi; bo'lmasa `loader` ni chaqirib, natijani yozib qo'yadi. */
  async readThrough<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached) as T;

    const value = await loader();
    await this.redis.set(key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
    return value;
  }

  async invalidateAll(): Promise<void> {
    await this.redis.del(CATALOG_CACHE_KEYS.categories, CATALOG_CACHE_KEYS.groups);
    this.logger.log("Katalog cache'i tozalandi");
  }
}
