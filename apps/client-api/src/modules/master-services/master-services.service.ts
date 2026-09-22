import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActorType, AuditAction, type ComplexityLevel } from '@prisma/client';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { AuditService } from '@client/modules/audit/audit.service';
import type { RequestContext } from '@client/common/http/request-context';

export interface MasterServiceView {
  categoryId: string;
  name: string;
  groupName: string | null;
  summary: string | null;
  basePrice: number;
  complexityLevel: ComplexityLevel;
  /** Usta shu ishni qabul qiladimi. */
  isEnabled: boolean;
  /** Katalogga yangi qoʻshilgan va usta hali javob bermagan xizmat. */
  isNew: boolean;
}

/** Kamida bitta xizmat yoqilgan boʻlishi shart — aks holda usta ishsiz qoladi. */
export const MIN_ENABLED_SERVICES = 1;

/**
 * Ustaning xizmatlari — u qaysi ishlarni qabul qilishini oʻzi boshqaradi.
 *
 * Yozuv hech qachon OʻCHIRILMAYDI, faqat `isEnabled` almashadi: usta
 * ertaga qaytadan yoqishi mumkin va «qachon biriktirilgan» tarixi
 * saqlanib qoladi.
 */
@Injectable()
export class MasterServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Ilova hisobiga bogʻlangan usta yozuvi.
   *
   * Yoʻq boʻlsa — foydalanuvchi hali usta emas (arizasi tasdiqlanmagan).
   * Bu xato emas, holat; chaqiruvchi buni ekranda aytadi.
   */
  async findMasterId(userId: string): Promise<string | null> {
    const master = await this.prisma.master.findUnique({
      where: { userId },
      select: { id: true, isActive: true },
    });

    return master?.isActive ? master.id : null;
  }

  /**
   * Katalogdagi BARCHA faol xizmatlar, har birida ustaning javobi.
   *
   * Roʻyxat katalogdan quriladi, ustaning yozuvlaridan emas: katalogga
   * yangi ish qoʻshilsa u darhol koʻrinadi va `isNew` bilan belgilanadi.
   * Usta hali javob bermagan ish YOQILMAGAN hisoblanadi — hech kim
   * soʻramagan ishni avtomatik yuklamaymiz.
   */
  async list(masterId: string): Promise<MasterServiceView[]> {
    const [categories, links] = await Promise.all([
      this.prisma.serviceCategory.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { group: { select: { name: true } } },
      }),
      this.prisma.masterServiceCategory.findMany({ where: { masterId } }),
    ]);

    const byCategory = new Map(links.map((link) => [link.categoryId, link]));

    return categories.map((category) => {
      const link = byCategory.get(category.id);
      return {
        categoryId: category.id,
        name: category.name,
        groupName: category.group?.name ?? null,
        summary: category.summary,
        basePrice: category.basePrice,
        complexityLevel: category.complexityLevel,
        isEnabled: link?.isEnabled ?? false,
        isNew: link === undefined,
      };
    });
  }

  /**
   * Yoqilgan xizmatlar roʻyxatini toʻliq almashtiradi.
   *
   * Roʻyxatdagi har bir id tekshiriladi: notanish yoki oʻchirilgan xizmat
   * kelsa amal butunlay rad etiladi — yarim qoʻllangan roʻyxat ustani
   * «nega bu ish kelmayapti» degan savol bilan qoldirardi.
   */
  async replace(
    masterId: string,
    categoryIds: readonly string[],
    userId: string,
    context: RequestContext,
  ): Promise<MasterServiceView[]> {
    const wanted = [...new Set(categoryIds)];

    if (wanted.length < MIN_ENABLED_SERVICES) {
      throw new ForbiddenException('Kamida bitta xizmat yoqilgan boʻlishi kerak.');
    }

    const active = await this.prisma.serviceCategory.findMany({
      where: { id: { in: wanted }, isActive: true },
      select: { id: true },
    });

    if (active.length !== wanted.length) {
      throw new NotFoundException('Roʻyxatda mavjud boʻlmagan yoki oʻchirilgan xizmat bor.');
    }

    await this.prisma.$transaction([
      // Avval hammasi oʻchiriladi, keyin tanlanganlari yoqiladi — shu bilan
      // roʻyxatdan chiqarilgan ish ham, qoʻshilgani ham bitta amalda hal
      // boʻladi va oraliq holat koʻrinmaydi.
      this.prisma.masterServiceCategory.updateMany({
        where: { masterId },
        data: { isEnabled: false },
      }),
      ...wanted.map((categoryId) =>
        this.prisma.masterServiceCategory.upsert({
          where: { masterId_categoryId: { masterId, categoryId } },
          create: { masterId, categoryId, isEnabled: true },
          update: { isEnabled: true },
        }),
      ),
    ]);

    await this.audit.record({
      action: AuditAction.MASTER_SERVICES_CHANGED,
      actorType: ActorType.MASTER,
      actorId: userId,
      metadata: { masterId, enabled: wanted.length },
      ...context,
    });

    return this.list(masterId);
  }
}
