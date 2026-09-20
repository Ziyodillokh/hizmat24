import { Injectable } from '@nestjs/common';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { levelDiscountPercent } from '../domain/levels';
import { LEVEL_COUNTED_STATUSES } from '../domain/order-status.enum';

/**
 * Daraja chegirmasi — SERVER hal qiladi (TZ 4.1).
 *
 * Ilova ham shu formulani biladi va ekranda koʻrsatadi, lekin buyurtmaga
 * yoziladigan foiz faqat shu yerdan keladi: aks holda oʻzgartirilgan ilova
 * oʻziga "oltin" daraja beraverardi.
 */
@Injectable()
export class LevelDiscountService {
  constructor(private readonly prisma: PrismaService) {}

  async percentForClient(clientId: string): Promise<number> {
    const closedOrders = await this.prisma.order.count({
      where: { clientId, status: { in: [...LEVEL_COUNTED_STATUSES] } },
    });

    return levelDiscountPercent(closedOrders);
  }
}
