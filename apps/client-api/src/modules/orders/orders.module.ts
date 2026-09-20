import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MatchingModule } from '@client/modules/matching/matching.module';
import { NotificationsModule } from '@client/modules/notifications/notifications.module';
import { CancelOrderHandler } from './application/commands/cancel-order.handler';
import { ConfirmMasterHandler } from './application/commands/confirm-master.handler';
import { CreateOrderHandler } from './application/commands/create-order.handler';
import {
  GetOrderEtaHandler,
  GetOrderHandler,
  GetOrderReceiptHandler,
  ListOrderHistoryHandler,
} from './application/queries/get-order.handler';
import { LevelDiscountService } from './application/level-discount.service';
import { OrderRealtimeListener } from './order-realtime.listener';
import { OrdersController } from './orders.controller';
import { OrdersInfrastructureModule } from './orders-infrastructure.module';

const commandHandlers = [CreateOrderHandler, CancelOrderHandler, ConfirmMasterHandler];
const queryHandlers = [
  GetOrderHandler,
  GetOrderEtaHandler,
  GetOrderReceiptHandler,
  ListOrderHistoryHandler,
];

@Module({
  imports: [CqrsModule, OrdersInfrastructureModule, MatchingModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [...commandHandlers, ...queryHandlers, LevelDiscountService, OrderRealtimeListener],
})
export class OrdersModule {}
