import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ActorType, AuditAction, CancelledBy, OrderStatus, Prisma } from '@prisma/client';
import { MAX_ASSIGNMENT_ATTEMPTS } from '@shared/index';
import { DomainException } from '@client/common/exceptions/domain.exception';
import type { RequestContext } from '@client/common/http/request-context';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { AuditService } from '@client/modules/audit/audit.service';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';
import { MatchingService } from '@client/modules/matching/matching.service';
import { OrdersRepository } from '@client/modules/orders/infrastructure/orders.repository';
import {
  adminCancelProblem,
  isEscalated,
  requeueProblem,
  SEARCHING_STATUSES,
} from './domain/operations-rules';
import type { ListOrdersQueryDto } from './dto/operations.dto';

export interface AdminOrderRow {
  id: string;
  shortId: string;
  status: OrderStatus;
  categoryName: string | null;
  clientName: string | null;
  clientPhone: string;
  masterName: string | null;
  price: number;
  isUrgent: boolean;
  /** Hisoblanadigan holat — ustun emas (`operations-rules.ts`). */
  isEscalated: boolean;
  assignmentAttempts: number;
  addressLabel: string | null;
  createdAt: Date;
}

export interface AdminOrderTimelineEntry {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  actorType: ActorType;
  reason: string | null;
  createdAt: Date;
}

export interface AdminOrderDetail extends AdminOrderRow {
  description: string;
  /**
   * Qaysi amal mumkinligini SERVER aytadi.
   *
   * Panel qoidani takrorlamaydi: takrorlansa, ikki joy bir-biridan
   * ogʻib ketardi va tugma ochiq turib, soʻrov rad etilardi. Sabab ham
   * shu yerdan keladi — foydalanuvchi taxmin qilib oʻtirmaydi.
   */
  canRequeue: boolean;
  requeueBlockedReason: string | null;
  canCancel: boolean;
  cancelBlockedReason: string | null;
  masterPhone: string | null;
  paymentMethod: string | null;
  workNote: string | null;
  cancelReason: string | null;
  scheduledAt: Date | null;
  timeline: AdminOrderTimelineEntry[];
}

export interface AdminOrdersPage {
  items: AdminOrderRow[];
  total: number;
  /** Eskalatsiya navbatidagi buyurtmalar soni — panel tepasidagi hisoblagich. */
  escalatedCount: number;
}

const LIST_SELECT = {
  id: true,
  shortId: true,
  status: true,
  price: true,
  isUrgent: true,
  assignmentAttempts: true,
  clientAddress: true,
  createdAt: true,
  client: { select: { fullName: true, phoneNumber: true } },
  master: { select: { fullName: true, phoneNumber: true } },
  category: { select: { name: true } },
} as const;

/**
 * Operator uchun buyurtmalar (A3).
 *
 * Panel butun oqimni koʻradi va tiqilib qolganini qoʻl bilan hal qiladi.
 * Ikki amal bor: qayta qidiruvga qoʻyish va bekor qilish — ikkalasi ham
 * auditga yoziladi, chunki ular mijozning buyurtmasiga tashqaridan
 * aralashish.
 */
@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersRepository,
    private readonly matching: MatchingService,
    private readonly audit: AuditService,
  ) {}

  async list(query: ListOrdersQueryDto): Promise<AdminOrdersPage> {
    const where = this.buildWhere(query);
    const limit = query.limit ?? 50;

    const [rows, total, escalatedCount] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: query.offset ?? 0,
      }),
      this.prisma.order.count({ where }),
      this.countEscalated(),
    ]);

    return { items: rows.map(toRow), total, escalatedCount };
  }

  /**
   * Eskalatsiya navbati.
   *
   * Alohida soʻrov: operator kun boshida aynan shu roʻyxatni ochadi va
   * uni filtr bilan qidirib oʻtirmasligi kerak.
   */
  async listEscalated(): Promise<AdminOrderRow[]> {
    const rows = await this.prisma.order.findMany({
      where: this.escalatedWhere(),
      select: LIST_SELECT,
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return rows.map(toRow);
  }

  countEscalated(): Promise<number> {
    return this.prisma.order.count({ where: this.escalatedWhere() });
  }

  async detail(orderId: string): Promise<AdminOrderDetail> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        ...LIST_SELECT,
        description: true,
        paymentMethod: true,
        workNote: true,
        cancelReason: true,
        scheduledAt: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: {
            fromStatus: true,
            toStatus: true,
            actorType: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Buyurtma topilmadi');

    const requeueBlocked = requeueProblem(order);
    const cancelBlocked = adminCancelProblem(order);

    return {
      ...toRow(order),
      description: order.description,
      canRequeue: requeueBlocked === null,
      requeueBlockedReason: requeueBlocked,
      canCancel: cancelBlocked === null,
      cancelBlockedReason: cancelBlocked,
      masterPhone: order.master?.phoneNumber ?? null,
      paymentMethod: order.paymentMethod,
      workNote: order.workNote,
      cancelReason: order.cancelReason,
      scheduledAt: order.scheduledAt,
      timeline: order.statusHistory,
    };
  }

  /**
   * Qayta qidiruvga qoʻyish.
   *
   * Urinishlar hisobi NOLGA tushiriladi: aks holda buyurtma darhol yana
   * eskalatsiyaga qaytardi va tugma hech narsa qilmagandek koʻrinardi.
   */
  async requeue(
    orderId: string,
    admin: AdminIdentity,
    context: RequestContext,
  ): Promise<AdminOrderDetail> {
    const order = await this.requireOrder(orderId);

    const problem = requeueProblem(order);
    if (problem) throw conflict('REQUEUE_NOT_ALLOWED', problem);

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { assignmentAttempts: 0, queuePosition: null },
      });

      await this.audit.record(
        {
          action: AuditAction.ADMIN_ORDER_REQUEUED,
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          orderId,
          metadata: { previousAttempts: order.assignmentAttempts },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        tx,
      );
    });

    // Navbatga yozish tranzaksiyadan TASHQARIDA: u tashqi tizim (Redis).
    await this.matching.requestMatching(orderId);
    this.logger.log({ orderId, adminId: admin.id }, 'Buyurtma qayta qidiruvga qoʻyildi');

    return this.detail(orderId);
  }

  /**
   * Operator bekor qilishi.
   *
   * `cancelledBy: SYSTEM` — mijoz ham, usta ham bekor qilmagan. Sabab
   * MAJBURIY va u mijoz ekranida soʻzma-soʻz koʻrinadi.
   */
  async cancel(
    orderId: string,
    reason: string,
    admin: AdminIdentity,
    context: RequestContext,
  ): Promise<AdminOrderDetail> {
    const order = await this.requireOrder(orderId);

    const problem = adminCancelProblem(order);
    if (problem) throw conflict('CANCEL_NOT_ALLOWED', problem);

    await this.prisma.$transaction(async (tx) => {
      const entity = await this.orders.findEntity(orderId, tx);
      if (!entity) throw new NotFoundException('Buyurtma topilmadi');

      await this.orders.applyTransition(
        entity,
        OrderStatus.CANCELLED,
        {
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          auditAction: AuditAction.ADMIN_ORDER_CANCELLED,
          reason,
          data: {
            cancelledAt: new Date(),
            cancelledBy: CancelledBy.SYSTEM,
            cancelReason: reason,
          },
        },
        tx,
      );

      await this.audit.record(
        {
          action: AuditAction.ADMIN_ORDER_CANCELLED,
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          orderId,
          metadata: { reason },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        tx,
      );
    });

    this.logger.warn({ orderId, adminId: admin.id }, 'Buyurtma operator tomonidan bekor qilindi');
    return this.detail(orderId);
  }

  private async requireOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, assignmentAttempts: true },
    });

    if (!order) throw new NotFoundException('Buyurtma topilmadi');
    return order;
  }

  private escalatedWhere(): Prisma.OrderWhereInput {
    return {
      status: { in: [...SEARCHING_STATUSES] },
      assignmentAttempts: { gte: MAX_ASSIGNMENT_ATTEMPTS },
    };
  }

  private buildWhere(query: ListOrdersQueryDto): Prisma.OrderWhereInput {
    const search = query.search?.trim();

    return {
      ...(query.status ? { status: query.status } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      // Qidiruv ikki maydon boʻyicha: buyurtma raqami va mijoz telefoni.
      // Operator qoʻlida odatda shu ikkisidan biri boʻladi.
      ...(search
        ? {
            OR: [
              { shortId: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { client: { phoneNumber: { contains: search } } },
            ],
          }
        : {}),
    };
  }
}

type OrderRow = Prisma.OrderGetPayload<{ select: typeof LIST_SELECT }>;

const toRow = (order: OrderRow): AdminOrderRow => ({
  id: order.id,
  shortId: order.shortId,
  status: order.status,
  categoryName: order.category?.name ?? null,
  clientName: order.client.fullName,
  clientPhone: order.client.phoneNumber,
  masterName: order.master?.fullName ?? null,
  price: order.price,
  isUrgent: order.isUrgent,
  isEscalated: isEscalated(order),
  assignmentAttempts: order.assignmentAttempts,
  addressLabel: readLabel(order.clientAddress),
  createdAt: order.createdAt,
});

/** Manzil JSON — shakli kafolatlanmagan, shuning uchun ehtiyot bilan oʻqiladi. */
function readLabel(address: Prisma.JsonValue): string | null {
  if (typeof address !== 'object' || address === null || Array.isArray(address)) return null;
  const label = (address as Record<string, unknown>).label;
  return typeof label === 'string' ? label : null;
}

const conflict = (code: string, message: string): DomainException =>
  new DomainException(code, message, HttpStatus.CONFLICT);
