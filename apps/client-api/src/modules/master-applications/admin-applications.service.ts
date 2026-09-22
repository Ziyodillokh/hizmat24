import { Injectable } from '@nestjs/common';
import {
  ActorType,
  AuditAction,
  type ComplexityLevel,
  MasterApplicationStatus,
  MasterExperienceLevel,
  Prisma,
  type MasterApplication,
} from '@prisma/client';
import type { RequestContext } from '@client/common/http/request-context';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { AuditService } from '@client/modules/audit/audit.service';
import type { PaginatedResult } from '@client/modules/orders/dto/pagination.dto';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';
import { canTransition } from './domain/application-status';
import { DEFAULT_WORK_FROM, DEFAULT_WORK_TO } from './domain/application-rules';
import { decideMasterLink } from './domain/master-link';
import type { ApproveApplicationDto, RejectApplicationDto } from './dto/review-application.dto';
import type { ListApplicationsQueryDto } from './dto/list-applications.dto';
import {
  ApplicationNotFoundException,
  InvalidApplicationTransitionException,
  MasterLinkConflictException,
  UnknownServiceCategoryException,
} from './application.exceptions';
import {
  toAdminDetail,
  toAdminListItem,
  type AdminApplicationDetail,
  type AdminApplicationListItem,
} from './application.view';

type Tx = Prisma.TransactionClient;

export interface AssignableCategory {
  id: string;
  name: string;
  groupName: string | null;
  complexityLevel: ComplexityLevel;
}

/** Usta arizalarining PANEL tomoni — `@AdminOnly('applications')` ostida. */
@Injectable()
export class AdminApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: ListApplicationsQueryDto): Promise<PaginatedResult<AdminApplicationListItem>> {
    const where = buildWhere(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.masterApplication.findMany({
        where,
        // Yangisidan eskisiga: moderator kutayotgan arizadan boshlaydi.
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.masterApplication.count({ where }),
    ]);

    return {
      items: items.map(toAdminListItem),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  /**
   * Tasdiqlash oynasidagi xizmatlar roʻyxati.
   *
   * `GET /admin/catalog/categories` `catalog` boʻlimiga bogʻlangan va
   * MODERATOR unga kira olmaydi — arizani tasdiqlaydigan odam esa aynan
   * moderator. Shuning uchun roʻyxat SHU boʻlim ostida, faqat oʻqish uchun
   * va faqat FAOL xizmatlar: oʻchirilgan xizmatni yangi ustaga biriktirish
   * mumkin emas (`ensureActiveCategories` ham shuni tekshiradi).
   */
  async listAssignableCategories(): Promise<AssignableCategory[]> {
    const categories = await this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, complexityLevel: true, group: { select: { name: true } } },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      groupName: category.group?.name ?? null,
      complexityLevel: category.complexityLevel,
    }));
  }

  async findOne(id: string): Promise<AdminApplicationDetail> {
    const application = await this.prisma.masterApplication.findUnique({ where: { id } });
    if (!application) throw new ApplicationNotFoundException(id);

    return toAdminDetail(application);
  }

  /**
   * Tasdiqlash — BITTA tranzaksiyada: usta yaratiladi yoki topiladi,
   * ilova hisobiga bogʻlanadi, xizmatlar biriktiriladi, profil yoziladi,
   * ariza yopiladi va audit yozuvi qoʻyiladi.
   *
   * Yarim bajarilgan tasdiq eng yomon natija boʻlardi: usta bor, lekin
   * xizmatsiz — u hech qachon buyurtma olmaydi va nega olmayotganini hech
   * kim tushunmaydi.
   */
  async approve(
    id: string,
    dto: ApproveApplicationDto,
    admin: AdminIdentity,
    context: RequestContext,
  ): Promise<AdminApplicationDetail> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const application = await loadPending(tx, id, MasterApplicationStatus.APPROVED);
      await ensureActiveCategories(tx, dto.categoryIds);

      const masterId = await this.resolveMaster(tx, application);
      await attachCategories(tx, masterId, dto.categoryIds);
      await writeProfile(tx, masterId, application);

      const result = await tx.masterApplication.update({
        where: { id },
        data: {
          status: MasterApplicationStatus.APPROVED,
          masterId,
          reviewedByAdminId: admin.id,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      });

      await this.recordReview(tx, {
        action: AuditAction.MASTER_APPLICATION_APPROVED,
        application,
        result,
        admin,
        context,
        metadata: { masterId, categoryIds: dto.categoryIds },
      });

      return result;
    });

    return toAdminDetail(updated);
  }

  async reject(
    id: string,
    dto: RejectApplicationDto,
    admin: AdminIdentity,
    context: RequestContext,
  ): Promise<AdminApplicationDetail> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const application = await loadPending(tx, id, MasterApplicationStatus.REJECTED);

      const result = await tx.masterApplication.update({
        where: { id },
        data: {
          status: MasterApplicationStatus.REJECTED,
          // Sabab mijoz ilovasida soʻzma-soʻz koʻrinadi.
          rejectionReason: dto.reason.trim(),
          reviewedByAdminId: admin.id,
          reviewedAt: new Date(),
        },
      });

      await this.recordReview(tx, {
        action: AuditAction.MASTER_APPLICATION_REJECTED,
        application,
        result,
        admin,
        context,
        metadata: { reason: dto.reason.trim() },
      });

      return result;
    });

    return toAdminDetail(updated);
  }

  /**
   * Usta yozuvini topadi yoki yaratadi.
   *
   * `hasGovCertificate` bu yerda HECH QACHON qoʻyilmaydi: foydalanuvchi
   * «sertifikatim bor» degani tekshirilmagan daʼvo, uni alohida amal
   * bilan admin tasdiqlaydi (A5).
   */
  private async resolveMaster(tx: Tx, application: MasterApplication): Promise<string> {
    const [byUser, byPhone] = await Promise.all([
      tx.master.findUnique({
        where: { userId: application.userId },
        select: { id: true, userId: true },
      }),
      tx.master.findUnique({
        where: { phoneNumber: application.phoneNumber },
        select: { id: true, userId: true },
      }),
    ]);

    const decision = decideMasterLink({ byUser, byPhone });
    if (decision.kind === 'conflict') throw new MasterLinkConflictException(decision.code);

    if (decision.kind === 'link') {
      const linked = await tx.master.update({
        where: { id: decision.masterId },
        data: {
          userId: application.userId,
          fullName: application.fullName,
          experienceLevel: experienceLevelOf(application),
          isActive: true,
        },
      });
      return linked.id;
    }

    const created = await tx.master.create({
      data: {
        userId: application.userId,
        fullName: application.fullName,
        phoneNumber: application.phoneNumber,
        experienceLevel: experienceLevelOf(application),
        hasGovCertificate: false,
      },
    });
    return created.id;
  }

  private recordReview(
    tx: Tx,
    entry: {
      action: AuditAction;
      application: MasterApplication;
      result: MasterApplication;
      admin: AdminIdentity;
      context: RequestContext;
      metadata: Prisma.InputJsonObject;
    },
  ): Promise<void> {
    return this.audit.record(
      {
        action: entry.action,
        actorType: ActorType.ADMIN,
        actorId: entry.admin.id,
        fromStatus: entry.application.status,
        toStatus: entry.result.status,
        metadata: { applicationId: entry.application.id, ...entry.metadata },
        ipAddress: entry.context.ipAddress,
        userAgent: entry.context.userAgent,
      },
      tx,
    );
  }
}

function buildWhere(query: ListApplicationsQueryDto): Prisma.MasterApplicationWhereInput {
  const search = query.search?.trim();

  return {
    ...(query.status ? { status: query.status } : {}),
    // Moderator odamni ismi bilan ham, raqami bilan ham qidiradi.
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { phoneNumber: { contains: search } },
          ],
        }
      : {}),
  };
}

/** Arizani oʻqiydi va soʻralgan oʻtish mumkinligiga ishonch hosil qiladi. */
async function loadPending(
  tx: Tx,
  id: string,
  to: MasterApplicationStatus,
): Promise<MasterApplication> {
  const application = await tx.masterApplication.findUnique({ where: { id } });
  if (!application) throw new ApplicationNotFoundException(id);

  if (!canTransition(application.status, to)) {
    throw new InvalidApplicationTransitionException(application.status, to);
  }

  return application;
}

async function ensureActiveCategories(tx: Tx, categoryIds: readonly string[]): Promise<void> {
  const unique = [...new Set(categoryIds)];
  const found = await tx.serviceCategory.findMany({
    where: { id: { in: unique }, isActive: true },
    select: { id: true },
  });

  if (found.length === unique.length) return;

  const known = new Set(found.map((category) => category.id));
  throw new UnknownServiceCategoryException(unique.filter((id) => !known.has(id)));
}

/**
 * Xizmatlar QOʻSHILADI, almashtirilmaydi: ustada oldin biriktirilgan
 * xizmatlar boʻlishi mumkin (eski, qoʻlda kiritilgan usta), ularni
 * ariza tasdigʻi jimgina oʻchirib yuborishi notoʻgʻri boʻlardi.
 */
function attachCategories(
  tx: Tx,
  masterId: string,
  categoryIds: readonly string[],
): Promise<unknown> {
  return tx.masterServiceCategory.createMany({
    data: [...new Set(categoryIds)].map((categoryId) => ({ masterId, categoryId })),
    skipDuplicates: true,
  });
}

/**
 * Arizada daraja soʻralmagan boʻlsa — eng past daraja.
 *
 * `masters.experience_level` majburiy ustun va u ariza emas, USTA
 * yozuvi: mijozga koʻrsatiladigan qiymat boʻlishi shart. Arizaning oʻzi
 * esa `null` boʻlib qolaveradi — panel «soʻralmagan» deb koʻrsatadi.
 */
const experienceLevelOf = (application: MasterApplication): MasterExperienceLevel =>
  application.experienceLevel ?? MasterExperienceLevel.NEW;

/**
 * Usta profili — bu ariza emas, ustaning tahrirlanadigan yozuvi.
 * Soʻralmagan maydonlar shu yerda standart qiymat oladi va ustaning
 * oʻzi keyin oʻzgartira oladi.
 */
function writeProfile(tx: Tx, masterId: string, application: MasterApplication): Promise<unknown> {
  const profile = {
    about: application.about ?? '',
    districts: application.districts,
    workFrom: application.workFrom ?? DEFAULT_WORK_FROM,
    workTo: application.workTo ?? DEFAULT_WORK_TO,
    claimsCertificate: application.claimsCertificate ?? false,
  };

  // `upsert`: eski usta qayta ariza bergan boʻlsa, profili yangilanadi.
  // `availableSince` tegilmaydi — smenani usta oʻzi ochadi (B4).
  return tx.masterProfile.upsert({
    where: { masterId },
    create: { masterId, ...profile },
    update: profile,
  });
}
