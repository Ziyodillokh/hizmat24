import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActorType, AuditAction, MasterStatus, OrderStatus, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import {
  AVERAGE_CITY_SPEED_KMH,
  JOB_MASTER_ACK_TIMEOUT,
  JOB_MATCH_ORDER,
  MASTER_ACK_TIMEOUT_MS,
  MAX_ASSIGNMENT_ATTEMPTS,
  MatchingEscalatedEvent,
  ORDER_EVENTS,
  OrderAssignedEvent,
  OrderQueuedEvent,
  QUEUE_MATCHING,
} from '@shared/index';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { AuditService } from '@client/modules/audit/audit.service';
import { OrdersRepository } from '@client/modules/orders/infrastructure/orders.repository';
import { MATCHABLE_STATUSES } from '@client/modules/orders/domain/order-status.enum';
import { estimateEtaMinutes } from '@client/common/utils/geo.util';
import { MasterFinderService } from './master-finder.service';
import { QueuePositionService } from './queue-position.service';

type OrderWithCategory = Prisma.OrderGetPayload<{ include: { category: true } }>;

/**
 * Tayinlash tranzaksiyasini ROLLBACK qilish uchun ichki signal: buyurtma
 * tanlangandan keyin, lekin tayinlanishdan oldin boshqa holatga o'tib ketgan.
 */
class StaleOrderError extends Error {
  constructor(readonly orderId: string) {
    super(`Buyurtma ${orderId} tayinlash paytida holatini o'zgartirdi`);
    this.name = 'StaleOrderError';
  }
}

interface MatchOutcome {
  kind: 'assigned' | 'queued' | 'skipped';
  masterId?: string;
  queuePosition?: number;
}

/**
 * Usta qidiruv logikasi (TZ 3.4).
 *
 * Buyurtma yaratilgach HTTP javob darhol qaytariladi, qidiruv esa BullMQ job
 * sifatida fonda ishlaydi — mijoz bloklanmaydi (9.5).
 */
@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersRepository,
    private readonly finder: MasterFinderService,
    private readonly queuePosition: QueuePositionService,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
    @InjectQueue(QUEUE_MATCHING) private readonly matchingQueue: Queue,
  ) {}

  /** Qidiruvni navbatga qo'yish (buyurtma yaratilgandan keyin darhol chaqiriladi). */
  async requestMatching(orderId: string, excludeMasterIds: string[] = []): Promise<void> {
    await this.matchingQueue.add(
      JOB_MATCH_ORDER,
      { orderId, excludeMasterIds },
      {
        jobId: `${JOB_MATCH_ORDER}:${orderId}:${Date.now()}`,
        removeOnComplete: 500,
        removeOnFail: 1000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );
  }

  /** Bitta buyurtma uchun qidiruv tsikli (processor tomonidan chaqiriladi). */
  async matchOrder(orderId: string, excludeMasterIds: string[] = []): Promise<MatchOutcome> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { category: true },
    });

    if (!order || !MATCHABLE_STATUSES.includes(order.status)) {
      return { kind: 'skipped' };
    }

    if (order.assignmentAttempts >= MAX_ASSIGNMENT_ATTEMPTS) {
      await this.escalate(order);
      return { kind: 'skipped' };
    }

    const assignedMasterId = await this.tryAssign(order, excludeMasterIds);

    if (assignedMasterId) {
      await this.queuePosition.remove(order.id);
      await this.scheduleAckTimeout(order.id, order.assignmentAttempts + 1);
      this.events.emit(
        ORDER_EVENTS.ASSIGNED,
        new OrderAssignedEvent(
          order.id,
          order.clientId,
          assignedMasterId,
          order.assignmentAttempts + 1,
        ),
      );
      return { kind: 'assigned', masterId: assignedMasterId };
    }

    const queuePosition = await this.enqueue(order);
    return { kind: 'queued', queuePosition };
  }

  /**
   * Tayinlash — bitta tranzaksiyada: usta bloklanadi, "band" holatiga o'tadi va
   * buyurtma `ASSIGNED` bo'ladi (nofunksional talab 7.3).
   */
  private async tryAssign(
    order: OrderWithCategory,
    excludeMasterIds: string[],
  ): Promise<string | null> {
    try {
      return await this.assignWithinTransaction(order, excludeMasterIds);
    } catch (error) {
      if (error instanceof StaleOrderError) {
        // Tranzaksiya orqaga qaytdi — usta ham bo'sh holicha qoldi.
        this.logger.debug({ orderId: order.id }, "Buyurtma tayinlash paytida holatini o'zgartirdi");
        return null;
      }
      throw error;
    }
  }

  private assignWithinTransaction(
    order: OrderWithCategory,
    excludeMasterIds: string[],
  ): Promise<string | null> {
    return this.prisma.$transaction(async (tx) => {
      const candidates = await this.finder.findCandidates(tx, {
        categoryId: order.categoryId,
        complexityLevel: order.category.complexityLevel,
        lat: order.addressLat,
        lng: order.addressLng,
        excludeMasterIds,
      });

      const candidate = candidates[0];
      if (!candidate) return null;

      const claimed = await tx.master.updateMany({
        where: { id: candidate.id, status: MasterStatus.AVAILABLE, isActive: true },
        data: { status: MasterStatus.BUSY },
      });

      if (claimed.count === 0) return null;

      const entity = await this.orders.findEntity(order.id, tx);

      // DIQQAT: bu yerda `return null` qilib bo'lmaydi — Prisma callback normal
      // tugaganda tranzaksiyani COMMIT qiladi va yuqoridagi "usta BUSY" yozuvi
      // saqlanib qolardi. Buyurtma oradan chiqib ketgan bo'lsa (masalan mijoz
      // parallel ravishda bekor qilgan), ustani bo'shatish uchun ROLLBACK kerak.
      if (!entity || !MATCHABLE_STATUSES.includes(entity.status)) {
        throw new StaleOrderError(order.id);
      }

      await this.orders.applyTransition(
        entity,
        OrderStatus.ASSIGNED,
        {
          actorType: ActorType.SYSTEM,
          auditAction: AuditAction.MASTER_ASSIGNED,
          metadata: { masterId: candidate.id, distanceKm: candidate.distance_km },
          data: {
            masterId: candidate.id,
            queuePosition: null,
            assignedAt: new Date(),
            masterAckedAt: null,
            assignmentAttempts: { increment: 1 },
            etaMinutes: estimateEtaMinutes(candidate.distance_km, AVERAGE_CITY_SPEED_KMH),
          },
        },
        tx,
      );

      return candidate.id;
    });
  }

  /**
   * Mos usta topilmadi → navbatga (TZ 3.4, 4-band).
   *
   * Navbat har 10 soniyada qayta tekshiriladi, shu sababli bildirishnoma FAQAT
   * pozitsiya haqiqatan o'zgarganda yuboriladi — aks holda mijoz har sweep'da
   * bir xil xabarni olardi.
   */
  private async enqueue(order: OrderWithCategory): Promise<number> {
    const position = await this.queuePosition.add(order.id, order.createdAt, order.isUrgent);
    const isFirstTime = order.status !== OrderStatus.SEARCHING_QUEUED;
    const hasMoved = order.queuePosition !== position;

    if (isFirstTime) {
      const entity = await this.orders.findEntity(order.id);
      if (entity) {
        await this.orders.applyTransition(entity, OrderStatus.SEARCHING_QUEUED, {
          actorType: ActorType.SYSTEM,
          data: { masterId: null, queuePosition: position, etaMinutes: null },
        });
      }
    } else if (hasMoved) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { queuePosition: position },
      });
    }

    if (isFirstTime || hasMoved) {
      const activeMasters = await this.finder.countActiveMastersInCategory(order.categoryId);
      this.events.emit(
        ORDER_EVENTS.QUEUED,
        new OrderQueuedEvent(
          order.id,
          order.clientId,
          position,
          QueuePositionService.estimateWaitMinutes(position, activeMasters),
        ),
      );
    }

    return position;
  }

  /** Usta 3 daqiqa ichida javob bermasa ishga tushadigan kechiktirilgan job (TZ 3.4). */
  private async scheduleAckTimeout(orderId: string, attempt: number): Promise<void> {
    await this.matchingQueue.add(
      JOB_MASTER_ACK_TIMEOUT,
      { orderId, attempt },
      {
        jobId: `${JOB_MASTER_ACK_TIMEOUT}:${orderId}:${attempt}`,
        delay: MASTER_ACK_TIMEOUT_MS,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }

  /**
   * Usta belgilangan vaqtda "Qabul qilaman" bosmadi — ustani bo'shatib,
   * buyurtmani keyingi mos ustaga yo'naltiramiz (TZ 3.4).
   */
  async handleAckTimeout(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.status !== OrderStatus.ASSIGNED || order.masterAckedAt !== null) {
      return;
    }

    const previousMasterId = order.masterId;

    await this.prisma.$transaction(async (tx) => {
      if (previousMasterId) {
        await tx.master.updateMany({
          where: { id: previousMasterId, status: MasterStatus.BUSY },
          data: { status: MasterStatus.AVAILABLE },
        });
      }

      const entity = await this.orders.findEntity(orderId, tx);
      if (!entity) return;

      await this.orders.applyTransition(
        entity,
        OrderStatus.SEARCHING,
        {
          actorType: ActorType.SYSTEM,
          auditAction: AuditAction.MASTER_ACK_TIMEOUT,
          reason: 'Usta 3 daqiqa ichida javob bermadi',
          metadata: { previousMasterId, attempt: order.assignmentAttempts },
          data: { masterId: null, etaMinutes: null, assignedAt: null },
        },
        tx,
      );
    });

    this.logger.warn(
      { orderId, previousMasterId, attempt: order.assignmentAttempts },
      'Usta javob bermadi — qayta tayinlash',
    );

    await this.requestMatching(orderId, previousMasterId ? [previousMasterId] : []);
  }

  /**
   * Navbatni tekshirish (TZ 3.4) — mijoz ilovasini qayta ochish talab qilinmaydi.
   *
   * Manba sifatida Redis emas, DB ishlatiladi: agar BullMQ ga job qo'shish
   * muvaffaqiyatsiz bo'lsa (Redis uzilishi va h.k.), buyurtma DB da qolgani
   * uchun shu sweep uni baribir topadi va tiklaydi.
   */
  async sweepQueue(limit = 20): Promise<void> {
    await this.recoverStaleAssignments(limit);

    const pending = await this.prisma.order.findMany({
      where: { status: { in: [...MATCHABLE_STATUSES] } },
      // TZ 3.4 dagi navbat tartibi: avval shoshilinch, keyin yaratilgan vaqt.
      orderBy: [{ isUrgent: 'desc' }, { createdAt: 'asc' }],
      take: limit,
      select: { id: true },
    });

    for (const order of pending) {
      await this.matchOrder(order.id);
    }
  }

  /**
   * Javob taymeri yo'qolgan tayinlashlarni tiklaydi.
   *
   * `scheduleAckTimeout` — BullMQ ga yozish, ya'ni DB dan tashqaridagi amal.
   * U muvaffaqiyatsiz bo'lsa, buyurtma `ASSIGNED` holatida abadiy qolib ketardi:
   * bu holat `MATCHABLE_STATUSES` ga kirmagani uchun oddiy sweep ham unga tegmaydi.
   */
  private async recoverStaleAssignments(limit: number): Promise<void> {
    const staleBefore = new Date(Date.now() - MASTER_ACK_TIMEOUT_MS * 2);

    const stale = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.ASSIGNED,
        masterAckedAt: null,
        assignedAt: { lt: staleBefore },
      },
      take: limit,
      select: { id: true },
    });

    for (const order of stale) {
      this.logger.warn({ orderId: order.id }, "Javob taymeri yo'qolgan tayinlash tiklanmoqda");
      await this.handleAckTimeout(order.id);
    }
  }

  /** Buyurtmani navbatdan olib tashlash (bekor qilinganda). */
  async removeFromQueue(orderId: string): Promise<void> {
    await this.queuePosition.remove(orderId);
  }

  /**
   * Urinishlar tugadi — admin panelga eskalatsiya (TZ 3.4).
   * Buyurtma navbatdan chiqariladi, aks holda har 10 soniyalik sweep uni
   * qayta-qayta eskalatsiya qilib, mijozga takroriy xabar yuborardi.
   */
  private async escalate(order: OrderWithCategory): Promise<void> {
    await this.queuePosition.remove(order.id);

    await this.audit.record({
      action: AuditAction.MATCHING_ESCALATED,
      orderId: order.id,
      actorType: ActorType.SYSTEM,
      metadata: { attempts: order.assignmentAttempts },
    });

    this.events.emit(
      ORDER_EVENTS.MATCHING_ESCALATED,
      new MatchingEscalatedEvent(order.id, order.clientId, order.assignmentAttempts),
    );

    this.logger.error(
      { orderId: order.id, attempts: order.assignmentAttempts },
      'Usta topilmadi — admin panelga eskalatsiya qilindi',
    );
  }
}
