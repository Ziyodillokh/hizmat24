import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_MATCHING } from '@shared/index';
import { OrdersInfrastructureModule } from '@client/modules/orders/orders-infrastructure.module';
import { MasterAvailabilityService } from './master-availability.service';
import { MasterFinderService } from './master-finder.service';
import { MatchingProcessor } from './matching.processor';
import { MatchingScheduler } from './matching.scheduler';
import { MatchingService } from './matching.service';
import { QueuePositionService } from './queue-position.service';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_MATCHING }), OrdersInfrastructureModule],
  providers: [
    MatchingService,
    MasterAvailabilityService,
    MasterFinderService,
    QueuePositionService,
    MatchingProcessor,
    MatchingScheduler,
  ],
  exports: [MatchingService, MasterAvailabilityService, QueuePositionService],
})
export class MatchingModule {}
