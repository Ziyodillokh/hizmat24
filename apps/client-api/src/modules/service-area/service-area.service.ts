import { Injectable } from '@nestjs/common';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import type { ServiceAreaView } from './domain/service-area-rules';

/** Panelga qaytariladigan toʻliq yozuv — tahrirlash uchun `id` ham kerak. */
export interface ServiceAreaRecord extends ServiceAreaView {
  id: string;
  isActive: boolean;
  sortOrder: number;
  updatedAt: Date;
}

@Injectable()
export class ServiceAreaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Buyurtma qabul qilinadigan hududlar.
   *
   * Cache QOʻYILMAGAN: jadvalda bir nechta qator boʻladi (hozir bitta) va
   * soʻrov indeks boʻyicha oʻqiydi. Cache qoʻyilsa, panelda chegarani
   * oʻzgartirgan odam natijani darhol koʻrmasdi — bu yerda bu muhimroq.
   */
  async listActive(): Promise<ServiceAreaView[]> {
    const areas = await this.prisma.serviceArea.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { cityName: 'asc' }],
      select: { cityName: true, centerLat: true, centerLng: true, radiusKm: true },
    });

    return areas;
  }

  /** Panel roʻyxati — faol boʻlmaganlari ham koʻrinadi. */
  listAll(): Promise<ServiceAreaRecord[]> {
    return this.prisma.serviceArea.findMany({
      orderBy: [{ sortOrder: 'asc' }, { cityName: 'asc' }],
      select: {
        id: true,
        cityName: true,
        centerLat: true,
        centerLng: true,
        radiusKm: true,
        isActive: true,
        sortOrder: true,
        updatedAt: true,
      },
    });
  }
}
