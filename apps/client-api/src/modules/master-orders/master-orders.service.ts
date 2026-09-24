import { ForbiddenException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ActorType, AuditAction, MasterStatus, OrderStatus, Prisma } from '@prisma/client';
import { DomainException } from '@client/common/exceptions/domain.exception';
import type { RequestContext } from '@client/common/http/request-context';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { AuditService } from '@client/modules/audit/audit.service';
import { MatchingService } from '@client/modules/matching/matching.service';
import {
  ORDER_RELATIONS,
  OrdersRepository,
} from '@client/modules/orders/infrastructure/orders.repository';
import {
  presentOrder,
  type OrderView,
  type OrderWithRelations,
} from '@client/modules/orders/infrastructure/order.presenter';
import {
  actionProblem,
  bucketOf,
  MASTER_ACTIVE_STATUSES,
  MASTER_HISTORY_STATUSES,
  ownershipProblem,
  type MasterAction,
  type MasterOrderBucket,
} from './domain/master-order-rules';

/** Mijozning bogʻlanish maʼlumoti — usta ishni QABUL QILGANDAN keyin. */
export interface OrderClientView {
  fullName: string | null;
  phoneNumber: string;
}

export interface MasterOrderView extends OrderView {
  bucket: MasterOrderBucket;
  /**
   * `null` — usta hali javob bermagan.
   *
   * Taklif bosqichida begona odamning telefon raqami koʻrsatilmaydi: usta
   * ishni olmasa ham raqam qoʻlida qolib ketardi. Manzil esa koʻrinadi —
   * usta qaror qabul qilishi uchun qayerga borishini bilishi shart.
   */
  client: OrderClientView | null;
}

interface ActionPayload {
  etaMinutes?: number;
  workNote?: string;
  reason?: string;
}

type OrderForMaster = OrderWithRelations & { client: { fullName: string | null; phoneNumber: string } };

const MASTER_VISIBLE_STATUSES: readonly OrderStatus[] = [
  ...MASTER_ACTIVE_STATUSES,
  ...MASTER_HISTORY_STATUSES,
];

/**
 * Usta tomonining serverdagi yuragi (B5).
 *
 * Tayinlash MODELI oʻzgarmadi: qidiruv ustani OʻZI tanlaydi va unga
 * biriktiradi (push), usta esa belgilangan vaqtda javob beradi. Bu yerda
 * shu modelning ustaga koʻrinadigan tomoni ochiladi — «takliflar
 * roʻyxati» ni alohida tortib olish (pull) qoʻshilmadi: ikkita tayinlash
 * yoʻli bir-birini buzardi va poyga holatlari ikki barobar koʻpayardi.
 */
@Injectable()
export class MasterOrdersService {
  private readonly logger = new Logger(MasterOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersRepository,
    private readonly matching: MatchingService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Ilova hisobiga bogʻlangan usta yozuvi.
   *
   * Bloklangan usta ham aniq javob oladi: «topilmadi» degan xabar uni
   * ilova buzuq deb oʻylashga majbur qilardi.
   */
  async requireMasterId(userId: string): Promise<string> {
    const master = await this.prisma.master.findUnique({
      where: { userId },
      select: { id: true, isActive: true },
    });

    if (!master) {
      throw new NotFoundException('Siz hali usta emassiz — arizangiz tasdiqlanishi kerak.');
    }
    if (!master.isActive) {
      throw new ForbiddenException('Hisobingiz vaqtincha bloklangan — qoʻllab-quvvatlashga yozing.');
    }

    return master.id;
  }

  /** Ustaning ishlari: takliflar, faol ish va yaqin tarix. */
  async list(masterId: string, historyLimit = 20): Promise<MasterOrderView[]> {
    const rows = await this.prisma.order.findMany({
      where: { masterId, status: { in: [...MASTER_VISIBLE_STATUSES] } },
      include: { ...ORDER_RELATIONS, client: CLIENT_FIELDS },
      orderBy: { createdAt: 'desc' },
      // Faol ishlar har doim sigʻadi: chegara faqat tarixni qirqadi va
      // roʻyxat cheksiz oʻsib ketmaydi.
      take: historyLimit + MASTER_ACTIVE_STATUSES.length * 5,
    });

    return rows.map((row) => this.present(row as OrderForMaster));
  }

  /**
   * Ustaning amali — hammasi bitta yoʻldan.
   *
   * Har amal tranzaksiya ichida qatorni QULFLAB oʻqiydi
   * (`FOR UPDATE`): javob kutish vaqti tugab, buyurtma boshqa ustaga
   * oʻtayotgan payt bilan ustaning tugma bosishi ustma-ust tushishi
   * mumkin. Qulfsiz ikkalasi ham «muvaffaqiyat» deb javob berardi.
   */
  async act(
    masterId: string,
    userId: string,
    orderId: string,
    action: MasterAction,
    payload: ActionPayload,
    context: RequestContext,
  ): Promise<MasterOrderView> {
    const result = await this.prisma.$transaction(async (tx) => {
      const locked = await this.lockOrder(tx, orderId);

      const ownership = ownershipProblem(locked, masterId);
      if (ownership) throw conflict('ORDER_TAKEN', ownership);

      const problem = actionProblem(action, locked);
      if (problem) throw conflict('ACTION_NOT_ALLOWED', problem);

      return this.apply(tx, action, orderId, masterId, userId, payload, context);
    });

    // Qayta qidirish tranzaksiyadan TASHQARIDA: navbatga yozish tashqi
    // tizim (Redis) bilan ishlaydi va uni tranzaksiya ichiga kiritish
    // bazani keraksiz uzoq ushlab turardi.
    if (action === 'decline') {
      await this.matching.requestMatching(orderId, [masterId]);
      this.logger.log({ orderId, masterId }, 'Usta ishni rad etdi — qayta qidiruv');
    }

    return result;
  }

  /**
   * Qatorni qulflab oʻqish.
   *
   * `findUnique` qulflamaydi, shuning uchun xom SQL: Prisma da `FOR UPDATE`
   * ni ifodalashning boshqa yoʻli yoʻq.
   */
  private async lockOrder(tx: Prisma.TransactionClient, orderId: string) {
    const rows = await tx.$queryRaw<
      { id: string; status: OrderStatus; master_id: string | null; master_acked_at: Date | null }[]
    >`SELECT id, status, master_id, master_acked_at FROM orders WHERE id = ${orderId}::uuid FOR UPDATE`;

    const row = rows[0];
    if (!row) throw new NotFoundException('Buyurtma topilmadi');

    return { status: row.status, masterId: row.master_id, masterAckedAt: row.master_acked_at };
  }

  private async apply(
    tx: Prisma.TransactionClient,
    action: MasterAction,
    orderId: string,
    masterId: string,
    userId: string,
    payload: ActionPayload,
    context: RequestContext,
  ): Promise<MasterOrderView> {
    switch (action) {
      case 'accept':
        return this.accept(tx, orderId, masterId, userId, context);
      case 'decline':
        return this.decline(tx, orderId, masterId, userId, payload.reason ?? null, context);
      case 'depart':
        return this.transition(tx, orderId, userId, OrderStatus.MASTER_EN_ROUTE, {
          enRouteAt: new Date(),
          etaMinutes: payload.etaMinutes ?? null,
        });
      case 'arrive':
        return this.transition(tx, orderId, userId, OrderStatus.ARRIVED_PENDING_CONFIRMATION, {
          arrivedAt: new Date(),
        });
      case 'finish':
        return this.finish(tx, orderId, masterId, userId, payload.workNote ?? null);
      case 'cancel':
        return this.cancel(tx, orderId, masterId, userId, payload.reason ?? '');
    }
  }

  /**
   * «Qabul qilaman».
   *
   * Holat OʻZGARMAYDI (`ASSIGNED` boʻlib qoladi): mijoz uchun hech narsa
   * oʻzgarmadi — usta hali yoʻlga chiqmadi. Oʻzgaradigan narsa bitta —
   * javob kutish taymeri endi bu buyurtmani boshqa ustaga oʻtkazmaydi
   * (`handleAckTimeout` `masterAckedAt` ni tekshiradi).
   */
  private async accept(
    tx: Prisma.TransactionClient,
    orderId: string,
    masterId: string,
    userId: string,
    context: RequestContext,
  ): Promise<MasterOrderView> {
    await tx.order.update({
      where: { id: orderId },
      data: { masterAckedAt: new Date(), handledByMaster: true },
    });

    await this.audit.record(
      {
        action: AuditAction.MASTER_ORDER_ACCEPTED,
        actorType: ActorType.MASTER,
        actorId: userId,
        orderId,
        metadata: { masterId },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
      tx,
    );

    return this.read(tx, orderId);
  }

  /**
   * «Rad etaman» — javob kutish tugashining qoʻlda bosilgan varianti.
   *
   * Usta boʻshatiladi va buyurtma qidiruvga qaytadi. Farqi: mijoz uch
   * daqiqa kutib oʻtirmaydi.
   */
  private async decline(
    tx: Prisma.TransactionClient,
    orderId: string,
    masterId: string,
    userId: string,
    reason: string | null,
    context: RequestContext,
  ): Promise<MasterOrderView> {
    await this.releaseMaster(tx, masterId);

    /*
     * Rad etish YOZUV sifatida qoladi. Faqat joriy qidiruv urinishidan
     * chetlatish yetarli emas: rejalashtiruvchi har 10 soniyada qidiruvni
     * qaytadan boshlaydi va shu ustaga oʻsha ishni bir necha soniyada
     * qaytarib berardi.
     */
    await tx.orderMasterDecline.upsert({
      where: { orderId_masterId: { orderId, masterId } },
      create: { orderId, masterId, reason },
      update: { reason },
    });

    const entity = await this.orders.findEntity(orderId, tx);
    if (!entity) throw new NotFoundException('Buyurtma topilmadi');

    await this.orders.applyTransition(
      entity,
      OrderStatus.SEARCHING,
      {
        actorType: ActorType.MASTER,
        actorId: userId,
        auditAction: AuditAction.MASTER_ORDER_DECLINED,
        reason: reason ?? 'Usta ishni rad etdi',
        metadata: { masterId },
        data: { masterId: null, etaMinutes: null, assignedAt: null, masterAckedAt: null },
      },
      tx,
    );

    await this.audit.record(
      {
        action: AuditAction.MASTER_ORDER_DECLINED,
        actorType: ActorType.MASTER,
        actorId: userId,
        orderId,
        metadata: { masterId, reason },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
      tx,
    );

    return this.read(tx, orderId);
  }

  private async transition(
    tx: Prisma.TransactionClient,
    orderId: string,
    userId: string,
    next: OrderStatus,
    data: Prisma.OrderUncheckedUpdateInput,
  ): Promise<MasterOrderView> {
    const entity = await this.orders.findEntity(orderId, tx);
    if (!entity) throw new NotFoundException('Buyurtma topilmadi');

    await this.orders.applyTransition(
      entity,
      next,
      { actorType: ActorType.MASTER, actorId: userId, data },
      tx,
    );

    return this.read(tx, orderId);
  }

  /**
   * Ish yakunlandi — usta boʻshaydi.
   *
   * Bajarilgan ishlar soni bu yerda OSHIRILMAYDI: u mijoz baho
   * berganda (`RatingsService`) oshadi. Ikki joyda oshirilsa raqam
   * ikki barobar boʻlib ketardi.
   */
  private async finish(
    tx: Prisma.TransactionClient,
    orderId: string,
    masterId: string,
    userId: string,
    workNote: string | null,
  ): Promise<MasterOrderView> {
    const note = workNote?.trim() ? workNote.trim() : null;
    const view = await this.transition(tx, orderId, userId, OrderStatus.COMPLETED_BY_MASTER, {
      completedAt: new Date(),
      workNote: note,
    });

    await this.releaseMaster(tx, masterId);
    return view;
  }

  private async cancel(
    tx: Prisma.TransactionClient,
    orderId: string,
    masterId: string,
    userId: string,
    reason: string,
  ): Promise<MasterOrderView> {
    const view = await this.transition(tx, orderId, userId, OrderStatus.CANCELLED, {
      cancelledAt: new Date(),
      cancelledBy: 'MASTER',
      cancelReason: reason,
    });

    await this.releaseMaster(tx, masterId);
    return view;
  }

  /**
   * Ustani boʻshatish — smenaga QARAB.
   *
   * Smenani yopib qoʻygan usta ish tugagach yana `AVAILABLE` boʻlib
   * qolsa, u soʻramagan taklif kelardi.
   */
  private async releaseMaster(tx: Prisma.TransactionClient, masterId: string): Promise<void> {
    const profile = await tx.masterProfile.findUnique({
      where: { masterId },
      select: { availableSince: true },
    });

    await tx.master.update({
      where: { id: masterId },
      data: {
        status: profile?.availableSince ? MasterStatus.AVAILABLE : MasterStatus.OFFLINE,
      },
    });
  }

  private async read(tx: Prisma.TransactionClient, orderId: string): Promise<MasterOrderView> {
    const row = await tx.order.findUnique({
      where: { id: orderId },
      include: { ...ORDER_RELATIONS, client: CLIENT_FIELDS },
    });

    if (!row) throw new NotFoundException('Buyurtma topilmadi');
    return this.present(row);
  }

  private present(row: OrderForMaster): MasterOrderView {
    const bucket = bucketOf({
      status: row.status,
      masterId: row.masterId,
      masterAckedAt: row.masterAckedAt,
    });

    return {
      ...presentOrder(row),
      bucket,
      client:
        bucket === 'offer'
          ? null
          : { fullName: row.client.fullName, phoneNumber: row.client.phoneNumber },
    };
  }
}

const CLIENT_FIELDS = { select: { fullName: true, phoneNumber: true } } as const;

const conflict = (code: string, message: string): DomainException =>
  new DomainException(code, message, HttpStatus.CONFLICT);
