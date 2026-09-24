import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ActorType,
  AuditAction,
  Prisma,
  SafetyAlertStatus,
  SafetyResolution,
} from '@prisma/client';
import { DomainException } from '@client/common/exceptions/domain.exception';
import type { RequestContext } from '@client/common/http/request-context';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { AuditService } from '@client/modules/audit/audit.service';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';
import { resolveProblem, suggestsBlock } from './domain/operations-rules';

export interface SafetyAlertView {
  id: string;
  status: SafetyAlertStatus;
  orderId: string;
  orderShortId: string;
  clientName: string | null;
  clientPhone: string;
  masterId: string | null;
  masterName: string | null;
  masterPhone: string | null;
  /** Usta bloklanganmi — operator qaytadan bloklamasligi uchun. */
  masterIsActive: boolean | null;
  clientNote: string | null;
  resolution: SafetyResolution | null;
  resolutionNote: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  /** Panel «ustani bloklaysizmi?» deb soʻraydimi. Qaror odamniki. */
  suggestsBlock: boolean;
}

export interface SafetyAlertsPage {
  items: SafetyAlertView[];
  /** Ochiq signallar soni — panel tepasidagi qizil hisoblagich. */
  openCount: number;
}

/**
 * Xavfsizlik signallari (A4).
 *
 * Mijoz eshik oldida «Bu men chaqirgan usta emas» deganda buyurtma
 * `SAFETY_FLAGGED` boʻladi va bu yerga signal tushadi. Buyurtma holati
 * OʻZGARTIRILMAYDI: hodisa tarixda oʻz holicha qolishi kerak, operator
 * faqat xulosa yozadi.
 */
@Injectable()
export class AdminSafetyService {
  private readonly logger = new Logger(AdminSafetyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(status?: SafetyAlertStatus): Promise<SafetyAlertsPage> {
    const [rows, openCount] = await Promise.all([
      this.prisma.safetyAlert.findMany({
        where: status ? { status } : {},
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        take: 100,
        include: {
          order: {
            select: {
              shortId: true,
              client: { select: { fullName: true, phoneNumber: true } },
              master: { select: { id: true, fullName: true, phoneNumber: true, isActive: true } },
            },
          },
        },
      }),
      this.countOpen(),
    ]);

    return { items: rows.map(toView), openCount };
  }

  countOpen(): Promise<number> {
    return this.prisma.safetyAlert.count({ where: { status: SafetyAlertStatus.OPEN } });
  }

  /**
   * Signalni yopish.
   *
   * Uch xil natija uch xil xulosa beradi, shuning uchun «yopildi» degan
   * yagona holat yetarli emas. Izoh MAJBURIY: qaror sababi yozilmasa,
   * keyin uni qayta koʻrib chiqishning imkoni boʻlmasdi.
   */
  async resolve(
    alertId: string,
    resolution: SafetyResolution,
    note: string,
    admin: AdminIdentity,
    context: RequestContext,
  ): Promise<SafetyAlertView> {
    const alert = await this.prisma.safetyAlert.findUnique({
      where: { id: alertId },
      select: { status: true, orderId: true, masterId: true },
    });

    if (!alert) throw new NotFoundException('Signal topilmadi');

    const problem = resolveProblem(alert.status);
    if (problem) throw conflict('ALERT_ALREADY_RESOLVED', problem);

    await this.prisma.$transaction(async (tx) => {
      await tx.safetyAlert.update({
        where: { id: alertId },
        data: {
          status: SafetyAlertStatus.RESOLVED,
          resolution,
          resolutionNote: note,
          resolvedByAdminId: admin.id,
          resolvedAt: new Date(),
        },
      });

      await this.audit.record(
        {
          action: AuditAction.SAFETY_ALERT_RESOLVED,
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          orderId: alert.orderId,
          metadata: { alertId, resolution, note, masterId: alert.masterId },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        tx,
      );
    });

    this.logger.warn({ alertId, resolution, adminId: admin.id }, 'Xavfsizlik signali yopildi');

    return this.readOne(alertId);
  }

  /**
   * Ustani bloklash/blokdan chiqarish.
   *
   * Bloklash AVTOMATIK emas — hatto tasdiqlangan hodisada ham operator
   * tugmani alohida bosadi (biznes-qoida 5.4). Bloklangan usta yangi
   * taklif olmaydi, lekin uning tarixi va boshlagan ishi tegilmaydi.
   */
  async setMasterActive(
    masterId: string,
    isActive: boolean,
    reason: string,
    admin: AdminIdentity,
    context: RequestContext,
  ): Promise<{ id: string; fullName: string; isActive: boolean }> {
    const master = await this.prisma.master.findUnique({
      where: { id: masterId },
      select: { id: true, fullName: true, isActive: true },
    });

    if (!master) throw new NotFoundException('Usta topilmadi');
    if (master.isActive === isActive) {
      throw conflict(
        'MASTER_STATE_UNCHANGED',
        isActive ? 'Usta allaqachon faol.' : 'Usta allaqachon bloklangan.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.master.update({
        where: { id: masterId },
        data: { isActive },
        select: { id: true, fullName: true, isActive: true },
      });

      await this.audit.record(
        {
          action: isActive ? AuditAction.MASTER_UNBLOCKED : AuditAction.MASTER_BLOCKED,
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          metadata: { masterId, reason },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        tx,
      );

      return result;
    });

    this.logger.warn({ masterId, isActive, adminId: admin.id }, 'Usta holati oʻzgartirildi');
    return updated;
  }

  private async readOne(alertId: string): Promise<SafetyAlertView> {
    const row = await this.prisma.safetyAlert.findUnique({
      where: { id: alertId },
      include: {
        order: {
          select: {
            shortId: true,
            client: { select: { fullName: true, phoneNumber: true } },
            master: { select: { id: true, fullName: true, phoneNumber: true, isActive: true } },
          },
        },
      },
    });

    if (!row) throw new NotFoundException('Signal topilmadi');
    return toView(row);
  }
}

type AlertRow = Prisma.SafetyAlertGetPayload<{
  include: {
    order: {
      select: {
        shortId: true;
        client: { select: { fullName: true; phoneNumber: true } };
        master: { select: { id: true; fullName: true; phoneNumber: true; isActive: true } };
      };
    };
  };
}>;

const toView = (alert: AlertRow): SafetyAlertView => ({
  id: alert.id,
  status: alert.status,
  orderId: alert.orderId,
  orderShortId: alert.order.shortId,
  clientName: alert.order.client.fullName,
  clientPhone: alert.order.client.phoneNumber,
  masterId: alert.order.master?.id ?? null,
  masterName: alert.order.master?.fullName ?? null,
  masterPhone: alert.order.master?.phoneNumber ?? null,
  masterIsActive: alert.order.master?.isActive ?? null,
  clientNote: alert.clientNote,
  resolution: alert.resolution,
  resolutionNote: alert.resolutionNote,
  createdAt: alert.createdAt,
  resolvedAt: alert.resolvedAt,
  suggestsBlock: alert.resolution !== null && suggestsBlock(alert.resolution),
});

const conflict = (code: string, message: string): DomainException =>
  new DomainException(code, message, HttpStatus.CONFLICT);
