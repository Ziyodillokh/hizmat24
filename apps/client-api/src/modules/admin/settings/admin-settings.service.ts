import { HttpStatus, Injectable } from '@nestjs/common';
import { ActorType, AuditAction, Prisma } from '@prisma/client';
import { DomainException } from '@client/common/exceptions/domain.exception';
import type { RequestContext } from '@client/common/http/request-context';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { AuditService } from '@client/modules/audit/audit.service';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';
import type { ServiceAreaRecord } from '@client/modules/service-area/service-area.service';
import type { UpdateServiceAreaDto } from './dto/service-area.dto';

const AREA_FIELDS = {
  id: true,
  cityName: true,
  centerLat: true,
  centerLng: true,
  radiusKm: true,
  isActive: true,
  sortOrder: true,
  updatedAt: true,
} as const;

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listAreas(): Promise<ServiceAreaRecord[]> {
    return this.prisma.serviceArea.findMany({
      orderBy: [{ sortOrder: 'asc' }, { cityName: 'asc' }],
      select: AREA_FIELDS,
    });
  }

  /**
   * Hududni yangilaydi va oʻzgarishni auditga yozadi.
   *
   * Chegara — platformaning qayerda ishlashini hal qiladigan sozlama.
   * Kim, qachon va nimani oʻzgartirgani yozilmasa, «nega Toshkentdan
   * buyurtma tushdi» degan savolga javob topilmasdi.
   */
  async updateArea(
    areaId: string,
    dto: UpdateServiceAreaDto,
    admin: AdminIdentity,
    context: RequestContext,
  ): Promise<ServiceAreaRecord> {
    const before = await this.prisma.serviceArea.findUnique({
      where: { id: areaId },
      select: AREA_FIELDS,
    });

    if (!before) {
      throw new DomainException('SERVICE_AREA_NOT_FOUND', 'Hudud topilmadi', HttpStatus.NOT_FOUND, {
        areaId,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const after = await tx.serviceArea.update({
        where: { id: areaId },
        data: toUpdateData(dto),
        select: AREA_FIELDS,
      });

      await this.audit.record(
        {
          action: AuditAction.SERVICE_AREA_UPDATED,
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          metadata: {
            areaId,
            before: toAuditShape(before),
            after: toAuditShape(after),
          },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        tx,
      );

      return after;
    });
  }
}

/**
 * Faqat YUBORILGAN maydonlar. `undefined` qoldirilgan maydon Prismaga
 * umuman ketmaydi — tegilmagan ustun eski qiymatida qoladi.
 */
function toUpdateData(dto: UpdateServiceAreaDto): Prisma.ServiceAreaUpdateInput {
  return {
    ...(dto.cityName !== undefined ? { cityName: dto.cityName.trim() } : {}),
    ...(dto.centerLat !== undefined ? { centerLat: dto.centerLat } : {}),
    ...(dto.centerLng !== undefined ? { centerLng: dto.centerLng } : {}),
    ...(dto.radiusKm !== undefined ? { radiusKm: dto.radiusKm } : {}),
    ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
  };
}

const toAuditShape = (area: ServiceAreaRecord) => ({
  cityName: area.cityName,
  centerLat: area.centerLat,
  centerLng: area.centerLng,
  radiusKm: area.radiusKm,
  isActive: area.isActive,
});
