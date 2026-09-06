import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActorType, OrderStatus, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import {
  JOB_RECALCULATE_MASTER_RATING,
  MASTER_EVENTS,
  MasterBecameAvailableEvent,
  ORDER_EVENTS,
  OrderRatedEvent,
  QUEUE_RATINGS,
} from '@shared/index';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import {
  ConflictException,
  DomainException,
  OrderNotFoundException,
} from '@client/common/exceptions/domain.exception';
import { OrdersRepository } from '@client/modules/orders/infrastructure/orders.repository';

export interface RatingView {
  id: string;
  orderId: string;
  stars: number;
  comment: string | null;
}

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersRepository,
    private readonly events: EventEmitter2,
    @InjectQueue(QUEUE_RATINGS) private readonly ratingsQueue: Queue,
  ) {}

  /**
   * Baholash (TZ 3.8). Bitta buyurtmaga bitta baho — takroriy so'rov 409 qaytaradi.
   * Baholashdan keyin buyurtma RATED → CLOSED holatiga o'tadi.
   */
  async rateOrder(
    orderId: string,
    clientId: string,
    stars: number,
    comment: string | null,
  ): Promise<RatingView> {
    const entity = await this.orders.findEntity(orderId);
    if (!entity) throw new OrderNotFoundException(orderId);

    entity.assertOwnedBy(clientId);

    if (entity.status !== OrderStatus.COMPLETED_BY_MASTER) {
      throw new DomainException(
        'RATING_NOT_ALLOWED',
        'Baholash faqat ish yakunlangandan keyin mumkin',
        HttpStatus.CONFLICT,
        { status: entity.status },
      );
    }

    const masterId = entity.masterId;
    if (!masterId) {
      throw new DomainException(
        'ORDER_HAS_NO_MASTER',
        'Buyurtmaga usta tayinlanmagan',
        HttpStatus.CONFLICT,
      );
    }

    const rating = await this.prisma
      .$transaction(async (tx) => {
        const created = await tx.rating.create({
          data: { orderId, clientId, masterId, stars, comment },
        });

        await this.orders.applyTransition(
          entity,
          OrderStatus.RATED,
          { actorType: ActorType.CLIENT, actorId: clientId, metadata: { stars } },
          tx,
        );

        // RATED → CLOSED: baholash yakunlangach buyurtma yopiladi (TZ 3.8).
        const ratedEntity = entity.transitionTo(OrderStatus.RATED);
        await this.orders.applyTransition(
          ratedEntity,
          OrderStatus.CLOSED,
          { actorType: ActorType.SYSTEM, data: { closedAt: new Date() } },
          tx,
        );

        // Usta holatiga bu yerda TEGILMAYDI: bo'sh/band invarianti bitta joyda —
        // `MasterAvailabilityService.reconcile()` da boshqariladi. Aks holda
        // mijoz kech baholaganda, allaqachon yangi ish olgan usta noto'g'ri
        // "bo'sh" deb belgilanib qolardi.
        await tx.master.update({
          where: { id: masterId },
          data: { completedOrdersCount: { increment: 1 } },
        });

        return created;
      })
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException(
            'RATING_ALREADY_EXISTS',
            'Bu buyurtma allaqachon baholangan',
            { orderId },
          );
        }
        throw error;
      });

    // Reyting o'rtachasi background job orqali qayta hisoblanadi (TZ 3.8).
    await this.ratingsQueue.add(
      JOB_RECALCULATE_MASTER_RATING,
      { masterId },
      { jobId: `${JOB_RECALCULATE_MASTER_RATING}:${masterId}:${rating.id}`, removeOnComplete: 200 },
    );

    this.events.emit(ORDER_EVENTS.RATED, new OrderRatedEvent(orderId, masterId, stars));
    this.events.emit(MASTER_EVENTS.BECAME_AVAILABLE, new MasterBecameAvailableEvent(masterId));

    return {
      id: rating.id,
      orderId: rating.orderId,
      stars: rating.stars,
      comment: rating.comment,
    };
  }

  /** Usta reytingini qayta hisoblash — real-vaqt so'rovini bloklamaydi. */
  async recalculateMasterRating(masterId: string): Promise<void> {
    const aggregate = await this.prisma.rating.aggregate({
      where: { masterId },
      _avg: { stars: true },
      _count: { _all: true },
    });

    await this.prisma.master.update({
      where: { id: masterId },
      data: {
        ratingAvg: new Prisma.Decimal((aggregate._avg.stars ?? 0).toFixed(2)),
        ratingCount: aggregate._count._all,
      },
    });

    this.logger.log(
      { masterId, ratingAvg: aggregate._avg.stars, ratingCount: aggregate._count._all },
      'Usta reytingi yangilandi',
    );
  }
}
