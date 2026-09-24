import { Injectable } from '@nestjs/common';
import { ActorType, AuditAction, CancelledBy, OrderStatus, Prisma } from '@prisma/client';
import { MAX_ASSIGNMENT_ATTEMPTS } from '@shared/index';
import { PrismaService } from '@client/infra/prisma/prisma.service';

export interface StatusCount {
  status: OrderStatus;
  count: number;
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface AdminStats {
  from: string;
  to: string;
  ordersTotal: number;
  byStatus: StatusCount[];
  byCategory: NamedCount[];
  cancelReasons: NamedCount[];
  /**
   * Buyurtma berilgandan usta tayinlangungacha oʻtgan oʻrtacha vaqt
   * (soniya). `null` — bu davrda tayinlangan buyurtma yoʻq; nol
   * «bir zumda tayinlandi» degan yolgʻon maʼnoni berardi.
   */
  avgAssignSeconds: number | null;
  /** Hozirgi holat — davrga bogʻliq emas. */
  mastersActive: number;
  mastersOnShift: number;
  openProblems: {
    escalatedOrders: number;
    openSafetyAlerts: number;
    pendingApplications: number;
  };
}

export interface AuditRow {
  id: string;
  action: AuditAction;
  actorType: ActorType;
  actorId: string | null;
  orderId: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
}

export interface AuditQuery {
  action?: AuditAction;
  actorType?: ActorType;
  orderId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/**
 * Hisobotlar va audit (A7).
 *
 * Hammasi SQL agregatsiyasi va KESHSIZ: kunlik hajm kichik, kesh esa
 * «bugungi raqamlar» degan ekranga eskirgan son chiqarib qoʻyardi —
 * bu yerda eng yomon xato shu.
 */
@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(fromRaw?: string, toRaw?: string): Promise<AdminStats> {
    const from = fromRaw ? new Date(fromRaw) : startOfToday();
    const to = toRaw ? new Date(toRaw) : new Date();
    const range = { gte: from, lte: to };

    const [byStatus, byCategory, cancelReasons, assigned, mastersActive, mastersOnShift, problems] =
      await Promise.all([
        this.prisma.order.groupBy({
          by: ['status'],
          where: { createdAt: range },
          _count: { _all: true },
        }),
        this.categoryCounts(range),
        this.prisma.order.groupBy({
          by: ['cancelledBy'],
          where: { createdAt: range, status: OrderStatus.CANCELLED },
          _count: { _all: true },
        }),
        this.prisma.order.findMany({
          where: { createdAt: range, assignedAt: { not: null } },
          select: { createdAt: true, assignedAt: true },
        }),
        this.prisma.master.count({ where: { isActive: true } }),
        this.prisma.masterProfile.count({ where: { availableSince: { not: null } } }),
        this.openProblems(),
      ]);

    const ordersTotal = byStatus.reduce((sum, row) => sum + row._count._all, 0);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      ordersTotal,
      byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
      byCategory,
      cancelReasons: cancelReasons.map((row) => ({
        name: CANCELLED_BY_LABELS[row.cancelledBy ?? 'UNKNOWN'] ?? 'Nomaʼlum',
        count: row._count._all,
      })),
      avgAssignSeconds: averageSeconds(assigned),
      mastersActive,
      mastersOnShift,
      openProblems: problems,
    };
  }

  async audit(query: AuditQuery): Promise<{ items: AuditRow[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.actorType ? { actorType: query.actorType } : {}),
      ...(query.orderId ? { orderId: query.orderId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 100,
        skip: query.offset ?? 0,
        select: {
          id: true,
          action: true,
          actorType: true,
          actorId: true,
          orderId: true,
          metadata: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * CSV eksport.
   *
   * Ustunlar va tartib `audit()` bilan bir xil. Har maydon qoʻshtirnoq
   * ichida: izohlarda vergul ham, qator koʻchirish ham uchraydi va
   * ularsiz fayl buzilardi.
   */
  async auditCsv(query: AuditQuery): Promise<string> {
    const { items } = await this.audit({ ...query, limit: 5000, offset: 0 });

    const header = ['vaqt', 'amal', 'aktor', 'aktor_id', 'buyurtma', 'tafsilot'];
    const rows = items.map((row) => [
      row.createdAt.toISOString(),
      row.action,
      row.actorType,
      row.actorId ?? '',
      row.orderId ?? '',
      row.metadata === null ? '' : JSON.stringify(row.metadata),
    ]);

    return [header, ...rows].map((cells) => cells.map(csvCell).join(',')).join('\n');
  }

  private async categoryCounts(range: { gte: Date; lte: Date }): Promise<NamedCount[]> {
    const grouped = await this.prisma.order.groupBy({
      by: ['categoryId'],
      where: { createdAt: range },
      _count: { _all: true },
    });

    if (grouped.length === 0) return [];

    const categories = await this.prisma.serviceCategory.findMany({
      where: { id: { in: grouped.map((row) => row.categoryId) } },
      select: { id: true, name: true },
    });
    const names = new Map(categories.map((row) => [row.id, row.name]));

    return grouped
      .map((row) => ({ name: names.get(row.categoryId) ?? 'Nomaʼlum', count: row._count._all }))
      .sort((a, b) => b.count - a.count);
  }

  private async openProblems(): Promise<AdminStats['openProblems']> {
    const [escalatedOrders, openSafetyAlerts, pendingApplications] = await Promise.all([
      this.prisma.order.count({
        where: {
          status: { in: [OrderStatus.SEARCHING, OrderStatus.SEARCHING_QUEUED] },
          assignmentAttempts: { gte: MAX_ASSIGNMENT_ATTEMPTS },
        },
      }),
      this.prisma.safetyAlert.count({ where: { status: 'OPEN' } }),
      this.prisma.masterApplication.count({ where: { status: 'PENDING' } }),
    ]);

    return { escalatedOrders, openSafetyAlerts, pendingApplications };
  }
}

const CANCELLED_BY_LABELS: Record<string, string> = {
  [CancelledBy.CLIENT]: 'Mijoz bekor qildi',
  [CancelledBy.MASTER]: 'Usta bekor qildi',
  [CancelledBy.SYSTEM]: 'Operator yoki tizim',
  UNKNOWN: 'Sabab yozilmagan',
};

const startOfToday = (): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

/** `null` — maʼlumot yoʻq; nol «bir zumda» degan yolgʻon boʻlardi. */
function averageSeconds(rows: { createdAt: Date; assignedAt: Date | null }[]): number | null {
  const deltas = rows
    .filter((row): row is { createdAt: Date; assignedAt: Date } => row.assignedAt !== null)
    .map((row) => (row.assignedAt.getTime() - row.createdAt.getTime()) / 1000)
    .filter((value) => value >= 0);

  if (deltas.length === 0) return null;
  return Math.round(deltas.reduce((sum, value) => sum + value, 0) / deltas.length);
}

const csvCell = (value: string): string => `"${value.replace(/"/g, '""')}"`;
