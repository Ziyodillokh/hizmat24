import { Injectable, Logger } from '@nestjs/common';
import { MasterStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '@client/infra/prisma/prisma.service';

/** Ustani "band" qiladigan holatlar — boshqa hamma holatda usta bo'sh boʻlishi kerak. */
const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.ASSIGNED,
  OrderStatus.MASTER_EN_ROUTE,
  OrderStatus.ARRIVED_PENDING_CONFIRMATION,
  OrderStatus.IN_PROGRESS,
];

@Injectable()
export class MasterAvailabilityService {
  private readonly logger = new Logger(MasterAvailabilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * O'zini-o'zi tuzatuvchi invariant: usta `BUSY` boʻlishi mumkin FAQAT unga
   * aktiv buyurtma biriktirilgan bo'lsa.
   *
   * Boʻshatilgan usta SMENAGA qarab holat oladi: smenasi ochiq boʻlsa
   * `AVAILABLE`, yopiq boʻlsa `OFFLINE`. Ilgari hammasi `AVAILABLE`
   * boʻlardi va smenasini yopib qoʻygan ustaga u soʻramagan taklif
   * kelib qolardi.
   *
   * Bu bir nechta holatni bir yo'la yopadi:
   *  - mijoz ishni baholamay ketsa, usta abadiy band boʻlib qolmaydi;
   *  - usta ilovasi buyurtmani yakunlagach (bu jarayondan tashqarida) usta bo'shaydi;
   *  - har qanday sababdan "yetim" qolgan BUSY yozuv tiklanadi.
   *
   * Bo'shatilgan ustalar ro'yxatini qaytaradi — chaqiruvchi navbatni tekshiradi.
   */
  async reconcile(): Promise<string[]> {
    const stuck = await this.prisma.master.findMany({
      where: {
        status: MasterStatus.BUSY,
        orders: { none: { status: { in: [...ACTIVE_ORDER_STATUSES] } } },
      },
      select: { id: true, profile: { select: { availableSince: true } } },
    });

    if (stuck.length === 0) return [];

    const onShift = stuck.filter((master) => master.profile?.availableSince).map((m) => m.id);
    const offShift = stuck.filter((master) => !master.profile?.availableSince).map((m) => m.id);

    if (onShift.length > 0) {
      await this.prisma.master.updateMany({
        where: { id: { in: onShift }, status: MasterStatus.BUSY },
        data: { status: MasterStatus.AVAILABLE },
      });
    }
    if (offShift.length > 0) {
      await this.prisma.master.updateMany({
        where: { id: { in: offShift }, status: MasterStatus.BUSY },
        data: { status: MasterStatus.OFFLINE },
      });
    }

    this.logger.log(
      { available: onShift, offline: offShift },
      "Aktiv buyurtmasiz band ustalar boʻshatildi",
    );

    // Navbatni faqat ISH OLADIGAN ustalar uchun tekshirish maʼnoli.
    return onShift;
  }
}
