import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActorType, AuditAction, OrderStatus, Prisma } from '@prisma/client';
import { ORDER_EVENTS, OrderStatusChangedEvent } from '@shared/index';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { AuditService } from '@client/modules/audit/audit.service';
import { ConflictException } from '@client/common/exceptions/domain.exception';
import { OrderEntity } from '../domain/order.entity';
import type { OrderWithRelations } from './order.presenter';

export const ORDER_RELATIONS = {
  master: true,
  category: true,
  rating: true,
} satisfies Prisma.OrderInclude;

export interface StatusChangeContext {
  actorType: ActorType;
  actorId?: string | null;
  reason?: string | null;
  auditAction?: AuditAction;
  metadata?: Prisma.InputJsonValue;
  /** Holat bilan birga yoziladigan qo'shimcha maydonlar (masterId, etaMinutes, ...). */
  data?: Prisma.OrderUncheckedUpdateInput;
}

type TxClient = Prisma.TransactionClient;

@Injectable()
export class OrdersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
  ) {}

  findById(orderId: string, tx?: TxClient): Promise<OrderWithRelations | null> {
    return (tx ?? this.prisma).order.findUnique({
      where: { id: orderId },
      include: ORDER_RELATIONS,
    });
  }

  async findEntity(orderId: string, tx?: TxClient): Promise<OrderEntity | null> {
    const order = await (tx ?? this.prisma).order.findUnique({ where: { id: orderId } });
    return order ? OrderEntity.fromPersistence(order) : null;
  }

  findByIdempotencyKey(
    clientId: string,
    idempotencyKey: string,
  ): Promise<OrderWithRelations | null> {
    return this.prisma.order.findUnique({
      where: { order_client_idempotency: { clientId, idempotencyKey } },
      include: ORDER_RELATIONS,
    });
  }

  /**
   * Holatni atomar o'zgartiradi (nofunksional talab 7.3).
   *
   * `where` shartiga joriy holat ham kiritiladi — shu sababli ikkita parallel
   * so'rovdan faqat bittasi muvaffaqiyatli bo'ladi (optimistik bloklash).
   */
  async applyTransition(
    entity: OrderEntity,
    next: OrderStatus,
    context: StatusChangeContext,
    tx?: TxClient,
  ): Promise<OrderWithRelations> {
    const previous = entity.status;
    // Domain qatlami o'tishning ruxsat etilganini tekshiradi.
    entity.transitionTo(next);

    // Holat + tarix + audit — bo'linmas to'plam. Chaqiruvchi o'z tranzaksiyasini
    // bermasa, o'zimiznikini ochamiz: aks holda oradagi uzilish holati
    // o'zgargan, lekin tarixsiz/auditsiz buyurtma qoldirardi.
    const result = tx
      ? await this.writeTransition(tx, entity, previous, next, context)
      : await this.prisma.$transaction((client) =>
          this.writeTransition(client, entity, previous, next, context),
        );

    // Har bir holat o'zgarishi bitta manbadan tarqaladi (TZ 9.6): WS + push shu
    // event'dan oziqlanadi, controller qatlamida hech qachon push chaqirilmaydi.
    this.events.emit(
      ORDER_EVENTS.STATUS_CHANGED,
      new OrderStatusChangedEvent(entity.id, result.clientId, previous, next),
    );

    return result;
  }

  private async writeTransition(
    client: TxClient,
    entity: OrderEntity,
    previous: OrderStatus,
    next: OrderStatus,
    context: StatusChangeContext,
  ): Promise<OrderWithRelations> {
    const updated = await client.order.updateMany({
      where: { id: entity.id, status: previous },
      data: { status: next, ...context.data },
    });

    if (updated.count === 0) {
      throw new ConflictException(
        'ORDER_STATE_CHANGED',
        "Buyurtma holati boshqa jarayon tomonidan o'zgartirildi, qaytadan urinib ko'ring",
        { expected: previous, target: next },
      );
    }

    await client.orderStatusHistory.create({
      data: {
        orderId: entity.id,
        fromStatus: previous,
        toStatus: next,
        actorType: context.actorType,
        actorId: context.actorId ?? null,
        reason: context.reason ?? null,
      },
    });

    await this.audit.record(
      {
        action: context.auditAction ?? AuditAction.ORDER_STATUS_CHANGED,
        orderId: entity.id,
        actorType: context.actorType,
        actorId: context.actorId ?? null,
        fromStatus: previous,
        toStatus: next,
        metadata: context.metadata,
      },
      client,
    );

    return await client.order.findUniqueOrThrow({
      where: { id: entity.id },
      include: ORDER_RELATIONS,
    });
  }

  async listHistory(
    clientId: string,
    page: number,
    limit: number,
  ): Promise<{ items: OrderWithRelations[]; total: number }> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { clientId },
        include: ORDER_RELATIONS,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where: { clientId } }),
    ]);

    return { items, total };
  }
}
