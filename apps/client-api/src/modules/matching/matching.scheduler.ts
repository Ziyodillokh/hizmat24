import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import {
  MASTER_EVENTS,
  QUEUE_SWEEP_INTERVAL_MS,
  type MasterBecameAvailableEvent,
} from '@shared/index';
import { MasterAvailabilityService } from './master-availability.service';
import { MatchingService } from './matching.service';

/**
 * Navbatdan avtomatik tayinlash (TZ 3.4, nofunksional talab 7.2).
 * Ikki manba: 10 soniyalik davriy sweep + usta bo'shaganda darhol ishlaydigan listener.
 */
@Injectable()
export class MatchingScheduler {
  private readonly logger = new Logger(MatchingScheduler.name);
  private isSweeping = false;

  constructor(
    private readonly matching: MatchingService,
    private readonly availability: MasterAvailabilityService,
  ) {}

  @Interval('queue-sweep', QUEUE_SWEEP_INTERVAL_MS)
  async sweep(): Promise<void> {
    if (this.isSweeping) return;

    this.isSweeping = true;
    try {
      // Avval "bo'sh/band" invariantini tiklaymiz, keyin navbatni tekshiramiz —
      // shunda bo'shatilgan ustalar shu tsiklning o'zida ish olishi mumkin.
      const freed = await this.availability.reconcile();
      if (freed.length > 0) {
        this.logger.log({ freed: freed.length }, "Band ustalar bo'shatildi");
      }

      await this.matching.sweepQueue();
    } catch (error) {
      this.logger.error({ err: error }, 'Navbatni tekshirishda xato');
    } finally {
      this.isSweeping = false;
    }
  }

  @OnEvent(MASTER_EVENTS.BECAME_AVAILABLE, { async: true })
  async onMasterAvailable(event: MasterBecameAvailableEvent): Promise<void> {
    this.logger.debug({ masterId: event.masterId }, "Usta bo'shadi — navbat tekshirilmoqda");
    await this.matching.sweepQueue();
  }
}
