import { Injectable, Logger } from '@nestjs/common';
import { MasterStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '@client/infra/prisma/prisma.service';

/** Ustani "band" qiladigan holatlar — boshqa hamma holatda usta bo'sh bo'lishi kerak. */
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
   * O'zini-o'zi tuzatuvchi invariant: usta `BUSY` bo'lishi mumkin FAQAT unga
   * aktiv buyurtma biriktirilgan bo'lsa.
   *
   * Bu bir nechta holatni bir yo'la yopadi:
   *  - mijoz ishni baholamay ketsa, usta abadiy band bo'lib qolmaydi;
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
      select: { id: true },
    });

    if (stuck.length === 0) return [];

    const ids = stuck.map((master) => master.id);

    await this.prisma.master.updateMany({
      where: { id: { in: ids }, status: MasterStatus.BUSY },
      data: { status: MasterStatus.AVAILABLE },
    });

    this.logger.log({ masterIds: ids }, "Aktiv buyurtmasiz band ustalar bo'shatildi");

    return ids;
  }
}
