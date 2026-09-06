import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import {
  AVERAGE_ORDER_DURATION_MINUTES,
  REDIS_QUEUE_KEY,
  URGENT_SCORE_BOOST_MS,
} from '@shared/index';
import { REDIS_CLIENT } from '@client/infra/redis/redis.module';

/**
 * Navbat pozitsiyasi Redis Sorted Set orqali hisoblanadi (9.5).
 * Tartib: avval `is_urgent=true`, keyin `created_at` bo'yicha (TZ 3.4).
 */
@Injectable()
export class QueuePositionService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  static scoreFor(createdAt: Date, isUrgent: boolean): number {
    return createdAt.getTime() - (isUrgent ? URGENT_SCORE_BOOST_MS : 0);
  }

  async add(orderId: string, createdAt: Date, isUrgent: boolean): Promise<number> {
    await this.redis.zadd(
      REDIS_QUEUE_KEY,
      QueuePositionService.scoreFor(createdAt, isUrgent),
      orderId,
    );
    return this.positionOf(orderId);
  }

  async remove(orderId: string): Promise<void> {
    await this.redis.zrem(REDIS_QUEUE_KEY, orderId);
  }

  /** 1-dan boshlanadigan pozitsiya; navbatda bo'lmasa 0. */
  async positionOf(orderId: string): Promise<number> {
    const rank = await this.redis.zrank(REDIS_QUEUE_KEY, orderId);
    return rank === null ? 0 : rank + 1;
  }

  /** Navbatning boshidagi buyurtma id'lari. */
  async peek(count: number): Promise<string[]> {
    return this.redis.zrange(REDIS_QUEUE_KEY, 0, Math.max(0, count - 1));
  }

  async all(): Promise<string[]> {
    return this.redis.zrange(REDIS_QUEUE_KEY, 0, -1);
  }

  async size(): Promise<number> {
    return this.redis.zcard(REDIS_QUEUE_KEY);
  }

  /**
   * Taxminiy kutish vaqti (daqiqa). Kategoriyadagi faol ustalar soni qancha ko'p bo'lsa,
   * navbat shuncha tez harakatlanadi.
   */
  static estimateWaitMinutes(position: number, activeMastersInCategory: number): number | null {
    if (position <= 0) return null;
    const throughput = Math.max(1, activeMastersInCategory);
    return Math.ceil((position * AVERAGE_ORDER_DURATION_MINUTES) / throughput);
  }
}
