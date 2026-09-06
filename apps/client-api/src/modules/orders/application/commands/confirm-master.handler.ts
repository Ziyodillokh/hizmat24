import { Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActorType, AuditAction, OrderStatus } from '@prisma/client';
import { ORDER_EVENTS, OrderSafetyFlaggedEvent } from '@shared/index';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { AuditService } from '@client/modules/audit/audit.service';
import { OrderNotFoundException } from '@client/common/exceptions/domain.exception';
import { OrdersRepository } from '../../infrastructure/orders.repository';
import { presentOrder, type OrderView } from '../../infrastructure/order.presenter';
import { ConfirmMasterCommand } from './confirm-master.command';

export interface ConfirmMasterResult {
  order: OrderView;
  message: string;
  safetyAlertId: string | null;
}

/**
 * Usta tasdiqlash — xavfsizlik nuqtai nazaridan eng nozik endpoint (TZ 3.7).
 *
 * `confirmed === false` bo'lganda ish HECH QANDAY holatda `IN_PROGRESS`'ga o'tmaydi:
 * `SAFETY_FLAGGED` — terminal holat, state-machine'da undan chiquvchi yo'l yo'q.
 */
@CommandHandler(ConfirmMasterCommand)
export class ConfirmMasterHandler implements ICommandHandler<
  ConfirmMasterCommand,
  ConfirmMasterResult
> {
  private readonly logger = new Logger(ConfirmMasterHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersRepository,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(command: ConfirmMasterCommand): Promise<ConfirmMasterResult> {
    const entity = await this.orders.findEntity(command.orderId);
    if (!entity) throw new OrderNotFoundException(command.orderId);

    entity.assertOwnedBy(command.clientId);

    return command.confirmed ? this.confirm(command, entity) : this.flag(command, entity);
  }

  private async confirm(
    command: ConfirmMasterCommand,
    entity: NonNullable<Awaited<ReturnType<OrdersRepository['findEntity']>>>,
  ): Promise<ConfirmMasterResult> {
    entity.confirmMaster();

    const order = await this.orders.applyTransition(entity, OrderStatus.IN_PROGRESS, {
      actorType: ActorType.CLIENT,
      actorId: command.clientId,
      data: { startedAt: new Date(), etaMinutes: null },
    });

    return {
      order: presentOrder(order),
      message: 'Ish boshlandi',
      safetyAlertId: null,
    };
  }

  private async flag(
    command: ConfirmMasterCommand,
    entity: NonNullable<Awaited<ReturnType<OrdersRepository['findEntity']>>>,
  ): Promise<ConfirmMasterResult> {
    entity.flagSafety();

    const { order, safetyAlert } = await this.prisma.$transaction(async (tx) => {
      const flagged = await this.orders.applyTransition(
        entity,
        OrderStatus.SAFETY_FLAGGED,
        {
          actorType: ActorType.CLIENT,
          actorId: command.clientId,
          reason: command.note ?? 'Kelgan shaxs tayinlangan usta emas',
          auditAction: AuditAction.SAFETY_FLAG_RAISED,
          metadata: { masterId: entity.masterId, note: command.note },
          data: { etaMinutes: null },
        },
        tx,
      );

      const alert = await tx.safetyAlert.create({
        data: {
          orderId: entity.id,
          clientId: command.clientId,
          masterId: entity.masterId,
          clientNote: command.note,
        },
      });

      // O'chirilmaydigan audit yozuvi: kim, qachon, qaysi buyurtma (TZ 3.7 izohi, 6.4).
      await this.audit.record(
        {
          action: AuditAction.SAFETY_FLAG_RAISED,
          orderId: entity.id,
          actorType: ActorType.CLIENT,
          actorId: command.clientId,
          fromStatus: OrderStatus.ARRIVED_PENDING_CONFIRMATION,
          toStatus: OrderStatus.SAFETY_FLAGGED,
          metadata: { safetyAlertId: alert.id, masterId: entity.masterId, note: command.note },
          ipAddress: command.ipAddress,
          userAgent: command.userAgent,
        },
        tx,
      );

      return { order: flagged, safetyAlert: alert };
    });

    this.logger.error(
      { orderId: entity.id, safetyAlertId: safetyAlert.id, masterId: entity.masterId },
      'XAVFSIZLIK SIGNALI: mijoz kelgan ustani tasdiqlamadi',
    );

    this.events.emit(
      ORDER_EVENTS.SAFETY_FLAGGED,
      new OrderSafetyFlaggedEvent(entity.id, command.clientId, entity.masterId, safetyAlert.id),
    );

    return {
      order: presentOrder(order),
      message: "Operatorimiz hoziroq siz bilan bog'lanadi",
      safetyAlertId: safetyAlert.id,
    };
  }
}
