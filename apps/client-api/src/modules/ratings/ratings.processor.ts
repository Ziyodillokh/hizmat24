import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { JOB_RECALCULATE_MASTER_RATING, QUEUE_RATINGS } from '@shared/index';
import { RatingsService } from './ratings.service';

@Processor(QUEUE_RATINGS, { concurrency: 5 })
export class RatingsProcessor extends WorkerHost {
  constructor(private readonly ratings: RatingsService) {
    super();
  }

  async process(job: Job<{ masterId: string }>): Promise<void> {
    if (job.name === JOB_RECALCULATE_MASTER_RATING) {
      await this.ratings.recalculateMasterRating(job.data.masterId);
    }
  }
}
