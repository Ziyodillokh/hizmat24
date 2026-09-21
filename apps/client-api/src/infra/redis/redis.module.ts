import { Global, Inject, Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { AppEnv } from '../config/env.validation';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * `useFactory` bilan yaratilgan obyektga Nest hayot-sikl hooklarini
 * qoʻllay olmaydi — `Redis` sinfida `onApplicationShutdown` yoʻq va
 * boʻlishi ham kerak emas. Shuning uchun yopishni alohida provayder
 * oʻz zimmasiga oladi.
 *
 * Busiz `app.close()` dan keyin Redis soketi ochiq qolardi: production da
 * bu SIGTERM dan keyin jarayonning darhol toʻxtamasligi (orkestrator uni
 * kuch bilan oʻldirishi), testlarda esa «Jest did not exit» — CI ishi
 * tugaganidan keyin ham osilib turardi.
 */
@Injectable()
class RedisShutdown implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    // `quit()` navbatdagi buyruqlarni tugatib yopadi; ulanish allaqachon
    // uzilgan boʻlsa istisno otadi va bu toʻxtashga toʻsqinlik qilmasligi
    // kerak.
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnv, true>): Redis =>
        new Redis({
          host: config.get('REDIS_HOST', { infer: true }),
          port: config.get('REDIS_PORT', { infer: true }),
          password: config.get('REDIS_PASSWORD', { infer: true }),
          db: config.get('REDIS_DB', { infer: true }),
          maxRetriesPerRequest: null,
          lazyConnect: false,
        }),
    },
    RedisShutdown,
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
