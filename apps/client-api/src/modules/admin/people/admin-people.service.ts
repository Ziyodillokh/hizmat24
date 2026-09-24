import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ActorType, AuditAction, CancelledBy, MasterStatus, Prisma, UserStatus } from '@prisma/client';
import { DomainException } from '@client/common/exceptions/domain.exception';
import type { RequestContext } from '@client/common/http/request-context';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { AuditService } from '@client/modules/audit/audit.service';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';
import { blockProblem, cancelRatePercent, maskPhone } from './domain/people-rules';

export interface AdminUserRow {
  id: string;
  fullName: string | null;
  /** Roʻyxatda DOIM maskalangan — toʻliq raqam alohida amal bilan ochiladi. */
  phoneMasked: string;
  status: UserStatus;
  ordersCount: number;
  isMaster: boolean;
  createdAt: Date;
}

export interface AdminUserOrderRow {
  id: string;
  shortId: string;
  status: string;
  price: number;
  createdAt: Date;
}

export interface AdminUserDetail extends AdminUserRow {
  orders: AdminUserOrderRow[];
}

export interface AdminMasterRow {
  id: string;
  fullName: string;
  phoneMasked: string;
  isActive: boolean;
  status: MasterStatus;
  ratingAvg: number;
  ratingCount: number;
  completedOrdersCount: number;
  cancelledByMasterCount: number;
  /** `null` — usta hali ishlamagan; nol foiz yolgʻon boʻlardi. */
  cancelRatePercent: number | null;
  enabledCategories: number;
  /** Smena ochiqmi — `available_since` boʻyicha. */
  isOnShift: boolean;
}

@Injectable()
export class AdminPeopleService {
  private readonly logger = new Logger(AdminPeopleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listUsers(search?: string, limit = 50): Promise<AdminUserRow[]> {
    const term = search?.trim();

    const rows = await this.prisma.user.findMany({
      where: term
        ? {
            OR: [
              { phoneNumber: { contains: term } },
              { fullName: { contains: term, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
        master: { select: { id: true } },
        _count: { select: { orders: true } },
      },
    });

    return rows.map(toUserRow);
  }

  async userDetail(userId: string): Promise<AdminUserDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
        master: { select: { id: true } },
        _count: { select: { orders: true } },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, shortId: true, status: true, price: true, createdAt: true },
        },
      },
    });

    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    return { ...toUserRow(user), orders: user.orders };
  }

  /**
   * Toʻliq telefon raqamini ochish — ALOHIDA amal.
   *
   * Har ochilish auditga yoziladi: panelga kirgan odam minglab raqamni
   * jimgina koʻchirib ololmasligi kerak. Iz qolishi bu ishni oʻz-oʻzidan
   * kamaytiradi.
   */
  async revealPhone(
    kind: 'user' | 'master',
    id: string,
    admin: AdminIdentity,
    context: RequestContext,
  ): Promise<{ phoneNumber: string }> {
    const record =
      kind === 'user'
        ? await this.prisma.user.findUnique({ where: { id }, select: { phoneNumber: true } })
        : await this.prisma.master.findUnique({ where: { id }, select: { phoneNumber: true } });

    if (!record) throw new NotFoundException('Yozuv topilmadi');

    await this.audit.record({
      action: AuditAction.PII_VIEWED,
      actorType: ActorType.ADMIN,
      actorId: admin.id,
      metadata: { kind, id, field: 'phoneNumber' },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    this.logger.log({ kind, id, adminId: admin.id }, 'Telefon raqami ochildi');
    return { phoneNumber: record.phoneNumber };
  }

  /**
   * Foydalanuvchini bloklash.
   *
   * Bloklangan odam ilovaga kira olmaydi — buni server allaqachon
   * tekshiradi (`AuthService.findActiveUser`). Bu yerda faqat holat
   * yoziladi va sabab auditga tushadi.
   */
  async setUserBlocked(
    userId: string,
    blocked: boolean,
    reason: string,
    admin: AdminIdentity,
    context: RequestContext,
  ): Promise<AdminUserRow> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const problem = blockProblem(user.status === UserStatus.BLOCKED, blocked);
    if (problem) throw conflict('USER_STATE_UNCHANGED', problem);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status: blocked ? UserStatus.BLOCKED : UserStatus.ACTIVE },
      });

      await this.audit.record(
        {
          action: blocked ? AuditAction.USER_BLOCKED : AuditAction.USER_UNBLOCKED,
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          metadata: { userId, reason },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        tx,
      );
    });

    this.logger.warn({ userId, blocked, adminId: admin.id }, 'Foydalanuvchi holati oʻzgardi');

    const rows = await this.listUsersById(userId);
    return rows;
  }

  async listMasters(search?: string, limit = 50): Promise<AdminMasterRow[]> {
    const term = search?.trim();

    const rows = await this.prisma.master.findMany({
      where: term
        ? {
            OR: [
              { phoneNumber: { contains: term } },
              { fullName: { contains: term, mode: Prisma.QueryMode.insensitive } },
            ],
          }
        : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        isActive: true,
        status: true,
        ratingAvg: true,
        ratingCount: true,
        completedOrdersCount: true,
        profile: { select: { availableSince: true } },
        _count: { select: { categories: true } },
      },
    });

    // Bekor qilishlar alohida sanaladi: `_count` faqat bogʻlanishlar
    // sonini beradi, shart boʻyicha filtrlay olmaydi.
    const cancelled = await this.countCancellations(rows.map((row) => row.id));

    return rows.map((row) => toMasterRow(row, cancelled.get(row.id) ?? 0));
  }

  private async countCancellations(masterIds: string[]): Promise<Map<string, number>> {
    if (masterIds.length === 0) return new Map();

    const grouped = await this.prisma.order.groupBy({
      by: ['masterId'],
      where: { masterId: { in: masterIds }, cancelledBy: CancelledBy.MASTER },
      _count: { _all: true },
    });

    return new Map(grouped.map((row) => [row.masterId as string, row._count._all]));
  }

  private async listUsersById(userId: string): Promise<AdminUserRow> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
        master: { select: { id: true } },
        _count: { select: { orders: true } },
      },
    });

    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return toUserRow(user);
  }
}

type UserRow = {
  id: string;
  fullName: string | null;
  phoneNumber: string;
  status: UserStatus;
  createdAt: Date;
  master: { id: string } | null;
  _count: { orders: number };
};

const toUserRow = (user: UserRow): AdminUserRow => ({
  id: user.id,
  fullName: user.fullName,
  phoneMasked: maskPhone(user.phoneNumber),
  status: user.status,
  ordersCount: user._count.orders,
  isMaster: user.master !== null,
  createdAt: user.createdAt,
});

type MasterRow = {
  id: string;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
  status: MasterStatus;
  ratingAvg: Prisma.Decimal;
  ratingCount: number;
  completedOrdersCount: number;
  profile: { availableSince: Date | null } | null;
  _count: { categories: number };
};

const toMasterRow = (master: MasterRow, cancelledByMasterCount: number): AdminMasterRow => ({
  id: master.id,
  fullName: master.fullName,
  phoneMasked: maskPhone(master.phoneNumber),
  isActive: master.isActive,
  status: master.status,
  ratingAvg: Number(master.ratingAvg),
  ratingCount: master.ratingCount,
  completedOrdersCount: master.completedOrdersCount,
  cancelledByMasterCount,
  cancelRatePercent: cancelRatePercent({
    completedOrdersCount: master.completedOrdersCount,
    cancelledByMasterCount,
  }),
  enabledCategories: master._count.categories,
  isOnShift: master.profile?.availableSince != null,
});

const conflict = (code: string, message: string): DomainException =>
  new DomainException(code, message, HttpStatus.CONFLICT);
