import { Module } from '@nestjs/common';
import { AuditModule } from '@client/modules/audit/audit.module';
import { MatchingModule } from '@client/modules/matching/matching.module';
import { OrdersInfrastructureModule } from '@client/modules/orders/orders-infrastructure.module';
import { MasterOrdersController } from './master-orders.controller';
import { MasterOrdersService } from './master-orders.service';
import { MasterShiftService } from './master-shift.service';

/** Usta ilovasining server tomoni: smena va ish amallari (B5). */
@Module({
  imports: [AuditModule, MatchingModule, OrdersInfrastructureModule],
  controllers: [MasterOrdersController],
  providers: [MasterOrdersService, MasterShiftService],
  exports: [MasterOrdersService, MasterShiftService],
})
export class MasterOrdersModule {}
