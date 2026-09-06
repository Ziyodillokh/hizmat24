import { Injectable } from '@nestjs/common';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { ForbiddenResourceException } from '@client/common/exceptions/domain.exception';
import { MASTER_PHONE_VISIBLE_STATUSES } from '@client/modules/orders/domain/order-status.enum';

export interface MasterProfileView {
  id: string;
  fullName: string;
  photoUrl: string | null;
  experienceLevel: string;
  hasGovCertificate: boolean;
  ratingAvg: number;
  completedOrdersCount: number;
  phoneNumber: string | null;
}

/**
 * Read-model (TZ 2.4): mijoz ilovasi ustani yaratmaydi/tahrirlamaydi.
 * Faqat o'ziga tayinlangan usta profilini o'qiy oladi.
 */
@Injectable()
export class MastersService {
  constructor(private readonly prisma: PrismaService) {}

  async findProfileForClient(masterId: string, clientId: string): Promise<MasterProfileView> {
    const relatedOrder = await this.prisma.order.findFirst({
      where: { masterId, clientId },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    });

    if (!relatedOrder) {
      throw new ForbiddenResourceException(
        "Bu usta profilini ko'rish uchun u bilan bog'liq buyurtmangiz bo'lishi kerak",
      );
    }

    const master = await this.prisma.master.findUniqueOrThrow({ where: { id: masterId } });

    return {
      id: master.id,
      fullName: master.fullName,
      photoUrl: master.photoUrl,
      experienceLevel: master.experienceLevel,
      hasGovCertificate: master.hasGovCertificate,
      ratingAvg: Number(master.ratingAvg),
      completedOrdersCount: master.completedOrdersCount,
      // Telefon raqami faqat aktiv buyurtma davomida ko'rinadi (xavfsizlik talabi 6.2).
      phoneNumber: MASTER_PHONE_VISIBLE_STATUSES.includes(relatedOrder.status)
        ? master.phoneNumber
        : null,
    };
  }
}
