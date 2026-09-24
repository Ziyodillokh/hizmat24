import { Injectable, Logger } from '@nestjs/common';
import { ActorType, AuditAction, MasterStatus } from '@prisma/client';
import type { RequestContext } from '@client/common/http/request-context';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { AuditService } from '@client/modules/audit/audit.service';
import { MASTER_ACTIVE_STATUSES } from './domain/master-order-rules';

export interface ShiftView {
  isOpen: boolean;
  /** Smena qachon ochilgani; yopiq smenada DOIM `null`. */
  since: string | null;
}

/**
 * Ustaning smenasi — SERVERDA.
 *
 * Ilgari smena faqat telefonda saqlanardi va hech kimga hech narsa
 * aytmasdi. Endi u `masters.status` ni boshqaradi: qidiruv faqat
 * `AVAILABLE` ustalarni koʻradi, demak smena yopiq usta ish olmaydi.
 *
 * Haqiqat manbai — `master_profiles.available_since`. `masters.status`
 * undan HOSILA: usta band boʻlishi ham mumkin (`BUSY`), lekin smenasi
 * ochiqligi oʻzgarmaydi. Ish tugagach u yana `AVAILABLE` ga qaytadi —
 * agar smenani yopmagan boʻlsa.
 */
@Injectable()
export class MasterShiftService {
  private readonly logger = new Logger(MasterShiftService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Smena holati va uni OʻZINI-OʻZI TUZATISH.
   *
   * Haqiqat manbai — `available_since`, lekin qidiruv `masters.status` ni
   * oʻqiydi. Ikkalasi ajralib qolishi mumkin: jarayon ikki yozuv orasida
   * uzilsa yoki bazaga qoʻldan tegilsa. Bunda ekran «smenadasiz» deb
   * turib, ustaga bitta ham taklif kelmasdi — tushuntirib boʻlmaydigan
   * holat. Shuning uchun har oʻqishda holat qayta hisoblanadi.
   */
  async read(masterId: string): Promise<ShiftView> {
    const [profile, master] = await Promise.all([
      this.prisma.masterProfile.findUnique({
        where: { masterId },
        select: { availableSince: true },
      }),
      this.prisma.master.findUnique({ where: { id: masterId }, select: { status: true } }),
    ]);

    const availableSince = profile?.availableSince ?? null;
    await this.alignStatus(masterId, availableSince, master?.status ?? null);

    return toView(availableSince);
  }

  /** Band usta TEGILMAYDI: uning holati ish tugagach tiklanadi. */
  private async alignStatus(
    masterId: string,
    availableSince: Date | null,
    current: MasterStatus | null,
  ): Promise<void> {
    if (current === null || current === MasterStatus.BUSY) return;

    const expected = availableSince ? MasterStatus.AVAILABLE : MasterStatus.OFFLINE;
    if (current === expected) return;

    await this.prisma.master.update({ where: { id: masterId }, data: { status: expected } });
    this.logger.warn({ masterId, from: current, to: expected }, 'Usta holati smenaga moslandi');
  }

  /**
   * Smenani ochish/yopish.
   *
   * Yopilganda ham FAOL ISH tegilmaydi: usta boshlagan ishni yakunlashi
   * kerak va uni yarim yoʻlda tashlab ketish mijozni kutib qoldirardi.
   * Yopiq smena faqat YANGI taklif kelishini toʻxtatadi.
   */
  async set(
    masterId: string,
    userId: string,
    isOpen: boolean,
    context: RequestContext,
  ): Promise<ShiftView> {
    const availableSince = isOpen ? new Date() : null;

    const busy = await this.hasActiveOrder(masterId);

    await this.prisma.$transaction(async (tx) => {
      await tx.masterProfile.upsert({
        where: { masterId },
        // Profil hali yaratilmagan boʻlishi mumkin (eski, qoʻlda
        // kiritilgan usta). Majburiy ustunlar standart qiymat oladi —
        // ular arizada soʻralmaydi.
        create: { masterId, availableSince, about: '', workFrom: 8, workTo: 20 },
        update: { availableSince },
      });

      // Band usta `BUSY` boʻlib qoladi: uning holati ish tugaganda
      // `MasterAvailabilityService` tomonidan smenaga qarab tiklanadi.
      if (!busy) {
        await tx.master.update({
          where: { id: masterId },
          data: { status: isOpen ? MasterStatus.AVAILABLE : MasterStatus.OFFLINE },
        });
      }

      await this.audit.record(
        {
          action: AuditAction.MASTER_SHIFT_CHANGED,
          actorType: ActorType.MASTER,
          actorId: userId,
          metadata: { masterId, isOpen, hasActiveOrder: busy },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        tx,
      );
    });

    this.logger.log({ masterId, isOpen, busy }, 'Usta smenasi oʻzgardi');

    return toView(availableSince);
  }

  private async hasActiveOrder(masterId: string): Promise<boolean> {
    const count = await this.prisma.order.count({
      where: { masterId, status: { in: [...MASTER_ACTIVE_STATUSES] } },
    });
    return count > 0;
  }
}

const toView = (availableSince: Date | null): ShiftView => ({
  isOpen: availableSince !== null,
  since: availableSince ? availableSince.toISOString() : null,
});
