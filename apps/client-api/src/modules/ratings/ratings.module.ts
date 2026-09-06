import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_RATINGS } from '@shared/index';
import { OrdersInfrastructureModule } from '@client/modules/orders/orders-infrastructure.module';
import { RatingsController } from './ratings.controller';
import { RatingsProcessor } from './ratings.processor';
import { RatingsService } from './ratings.service';

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_RATINGS }), OrdersInfrastructureModule],
  controllers: [RatingsController],
  providers: [RatingsService, RatingsProcessor],
})
export class RatingsModule {}
