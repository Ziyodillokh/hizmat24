import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { JOB_MASTER_ACK_TIMEOUT, JOB_MATCH_ORDER, QUEUE_MATCHING } from '@shared/index';
import { MatchingService } from './matching.service';

interface MatchOrderJob {
  orderId: string;
  excludeMasterIds?: string[];
}

interface AckTimeoutJob {
  orderId: string;
  attempt: number;
}

@Processor(QUEUE_MATCHING, { concurrency: 10 })
export class MatchingProcessor extends WorkerHost {
  private readonly logger = new Logger(MatchingProcessor.name);

  constructor(private readonly matching: MatchingService) {
    super();
  }

  async process(job: Job<MatchOrderJob | AckTimeoutJob>): Promise<void> {
    switch (job.name) {
      case JOB_MATCH_ORDER: {
        const data = job.data as MatchOrderJob;
        await this.matching.matchOrder(data.orderId, data.excludeMasterIds ?? []);
        return;
      }
      case JOB_MASTER_ACK_TIMEOUT: {
        const data = job.data as AckTimeoutJob;
        await this.matching.handleAckTimeout(data.orderId);
        return;
      }
      default:
        this.logger.warn({ jobName: job.name }, "Noma'lum job turi");
    }
  }
}
