import { Injectable } from '@nestjs/common';
import { ActorType, AuditAction, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '@shared/index';
import type { RequestContext } from '@client/common/http/request-context';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { AuditService } from '@client/modules/audit/audit.service';
import type { SubmitApplicationDto } from './dto/submit-application.dto';
import { assessApplication, normalizeDraft } from './domain/application-rules';
import {
  DuplicatePendingApplicationException,
  InvalidApplicationException,
  MasterLinkConflictException,
  UnknownServiceCategoryException,
} from './application.exceptions';
import { toMyApplicationView, type MyApplicationView } from './application.view';

/** Qisman unique indeks buzilganda Prisma shu kodni beradi. */
const UNIQUE_VIOLATION = 'P2002';

/**
 * Usta boʻlish arizasi — MIJOZ ilovasi tomoni.
 *
 * Panel tomoni `admin-applications.service.ts` da: ikkovining auditoriyasi
 * ham, ruxsati ham boshqa, shuning uchun bitta faylga qoʻshilmagan.
 */
@Injectable()
export class MasterApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async submit(
    user: AuthenticatedUser,
    dto: SubmitApplicationDto,
    context: RequestContext,
  ): Promise<MyApplicationView> {
    const draft = normalizeDraft(dto);
    const verdict = assessApplication(draft);
    if (!verdict.ok) throw new InvalidApplicationException(verdict.problems);

    await this.ensureNotMasterYet(user.id);
    await this.ensureCategoriesExist(draft.requestedCategoryIds);

    try {
      return await this.createWithAudit(user, dto, draft, context);
    } catch (error) {
      // Poyga holati: ikki soʻrov bir vaqtda kelsa, baza indeksi ikkinchisini
      // toʻxtatadi. Foydalanuvchi buni texnik xato emas, tushunarli javob
      // sifatida koʻrishi kerak.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_VIOLATION
      ) {
        throw new DuplicatePendingApplicationException();
      }
      throw error;
    }
  }

  /** Ilova shu javob bilan ariza holatini va rad sababini koʻrsatadi. */
  async findMine(userId: string): Promise<MyApplicationView | null> {
    const application = await this.prisma.masterApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return application ? toMyApplicationView(application) : null;
  }

  private async createWithAudit(
    user: AuthenticatedUser,
    dto: SubmitApplicationDto,
    draft: ReturnType<typeof normalizeDraft>,
    context: RequestContext,
  ): Promise<MyApplicationView> {
    /*
     * Ariza va audit yozuvi BITTA tranzaksiyada.
     *
     * NEGA tranzaksiyadan keyin emas: audit — amalning isboti. Yozuv
     * keyin qoʻyilsa va jarayon shu orada oʻlsa, bazada izsiz ariza
     * qolardi; oldin qoʻyilsa va ariza yozilmasa, boʻlmagan voqea haqida
     * yozuv qolardi. Tranzaksiya ichida ikkalasi ham boʻladi yoki
     * ikkalasi ham boʻlmaydi. `AuditService.record` aynan shuning uchun
     * tranzaksiya klientini qabul qiladi.
     */
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.masterApplication.create({
        data: {
          userId: user.id,
          fullName: draft.fullName,
          // Telefon tokendan — soʻrov tanasida bu maydon umuman yoʻq.
          phoneNumber: user.phoneNumber,
          profession: draft.profession,
          experienceLevel: dto.experienceLevel,
          claimsCertificate: dto.claimsCertificate,
          about: draft.about,
          districts: [...draft.districts],
          workFrom: draft.workFrom,
          workTo: draft.workTo,
          requestedCategoryIds: [...draft.requestedCategoryIds],
        },
      });

      await this.audit.record(
        {
          action: AuditAction.MASTER_APPLICATION_SUBMITTED,
          actorType: ActorType.CLIENT,
          actorId: user.id,
          toStatus: application.status,
          metadata: {
            applicationId: application.id,
            requestedCategoryIds: [...draft.requestedCategoryIds],
          },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        tx,
      );

      return toMyApplicationView(application);
    });
  }

  /**
   * Usta boʻlib boʻlgan odamga ariza kerak emas.
   *
   * NEGA kutayotgan ariza alohida tekshirilmaydi: uni baza indeksi
   * toʻxtatadi va javob `submit` dagi `catch` da beriladi — bu yerda
   * qayta oʻqish ortiqcha soʻrov boʻlardi va poygani baribir yopmasdi.
   */
  private async ensureNotMasterYet(userId: string): Promise<void> {
    const master = await this.prisma.master.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (master) throw new MasterLinkConflictException('ALREADY_MASTER');
  }

  private async ensureCategoriesExist(categoryIds: readonly string[]): Promise<void> {
    const found = await this.prisma.serviceCategory.findMany({
      where: { id: { in: [...categoryIds] }, isActive: true },
      select: { id: true },
    });

    if (found.length === categoryIds.length) return;

    const known = new Set(found.map((category) => category.id));
    throw new UnknownServiceCategoryException(categoryIds.filter((id) => !known.has(id)));
  }
}
