import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActorType, AuditAction, CancelledBy, MasterStatus, OrderStatus } from '@prisma/client';
import {
  MASTER_EVENTS,
  MasterBecameAvailableEvent,
  ORDER_EVENTS,
  OrderCancelledEvent,
} from '@shared/index';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { OrderNotFoundException } from '@client/common/exceptions/domain.exception';
import { MatchingService } from '@client/modules/matching/matching.service';
import { OrdersRepository } from '../../infrastructure/orders.repository';
import { presentOrder, type OrderView } from '../../infrastructure/order.presenter';
import { CancelOrderCommand } from './cancel-order.command';

@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<CancelOrderCommand, OrderView> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersRepository,
    private readonly matching: MatchingService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(command: CancelOrderCommand): Promise<OrderView> {
    const entity = await this.orders.findEntity(command.orderId);
    if (!entity) throw new OrderNotFoundException(command.orderId);

    entity.assertOwnedBy(command.clientId);
    // Domain qatlami IN_PROGRESS'dan keyingi bekor qilishni 403 bilan rad etadi (5.5).
    entity.cancelByClient();

    const freedMasterId = entity.masterId;

    const cancelled = await this.prisma.$transaction(async (tx) => {
      if (freedMasterId) {
        await tx.master.updateMany({
          where: { id: freedMasterId, status: MasterStatus.BUSY },
          data: { status: MasterStatus.AVAILABLE },
        });
      }

      return this.orders.applyTransition(
        entity,
        OrderStatus.CANCELLED,
        {
          actorType: ActorType.CLIENT,
          actorId: command.clientId,
          reason: command.reason,
          auditAction: AuditAction.ORDER_CANCELLED,
          metadata: { freedMasterId },
          data: {
            cancelReason: command.reason,
            cancelledBy: CancelledBy.CLIENT,
            cancelledAt: new Date(),
            queuePosition: null,
            etaMinutes: null,
          },
        },
        tx,
      );
    });

    await this.matching.removeFromQueue(command.orderId);

    this.events.emit(
      ORDER_EVENTS.CANCELLED,
      new OrderCancelledEvent(
        command.orderId,
        command.clientId,
        freedMasterId,
        'CLIENT',
        command.reason,
      ),
    );

    if (freedMasterId) {
      // Usta bo'shadi → navbatdagi keyingi buyurtma darhol tekshiriladi (TZ 3.4).
      this.events.emit(
        MASTER_EVENTS.BECAME_AVAILABLE,
        new MasterBecameAvailableEvent(freedMasterId),
      );
    }

    return presentOrder(cancelled);
  }
}
