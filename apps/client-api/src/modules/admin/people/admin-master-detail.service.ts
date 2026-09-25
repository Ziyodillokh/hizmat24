import { Injectable, NotFoundException } from '@nestjs/common';
import { CancelledBy, Prisma, type MasterExperienceLevel, type MasterStatus } from '@prisma/client';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { cancelRatePercent, maskPhone } from './domain/people-rules';

/** Ustaning oxirgi ishlari — tafsilot ekranidagi jadval. */
export interface AdminMasterOrderRow {
  id: string;
  shortId: string;
  status: string;
  price: number;
  categoryName: string | null;
  createdAt: Date;
}

/** Mijoz qoldirgan baho. Matn oʻzgartirilmaydi — u mijozning gapi. */
export interface AdminMasterReview {
  orderShortId: string;
  stars: number;
  comment: string | null;
  tags: string[];
  createdAt: Date;
}

/**
 * Ustaning toʻliq kartasi.
 *
 * Platforma TASDIQLAGAN koʻrsatkichlar (reyting, bajarilgan ishlar,
 * `hasGovCertificate`) ustaning OʻZI AYTGAN maʼlumotlaridan (`profile`)
 * ataylab ajratilgan: panelda ham bu farq koʻrinib turishi kerak, aks
 * holda «sertifikatim bor» degan daʼvo tasdiq kabi oʻqilardi.
 */
export interface AdminMasterDetail {
  id: string;
  fullName: string;
  phoneMasked: string;
  isActive: boolean;
  status: MasterStatus;
  experienceLevel: MasterExperienceLevel;
  /** Admin tasdiqlagan sertifikat. */
  hasGovCertificate: boolean;
  photoUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  completedOrdersCount: number;
  cancelledByMasterCount: number;
  /** `null` — usta hali ishlamagan; nol foiz yolgʻon boʻlardi. */
  cancelRatePercent: number | null;
  isOnShift: boolean;
  /** `null` — ariza orqali oʻtmagan, qoʻlda kiritilgan usta. */
  userId: string | null;
  createdAt: Date;
  /** Ustaning oʻzi aytgani. `null` — profil hali toʻldirilmagan. */
  profile: {
    about: string;
    districts: string[];
    workFrom: number;
    workTo: number;
    /** DAʼVO, tasdiq emas. */
    claimsCertificate: boolean;
    availableSince: Date | null;
  } | null;
  /** Usta yoqib qoʻygan xizmatlar. */
  categories: string[];
  orders: AdminMasterOrderRow[];
  reviews: AdminMasterReview[];
}

const ORDERS_LIMIT = 20;
const REVIEWS_LIMIT = 20;

/** Tafsilot uchun kerakli maydonlar — soʻrovdan ajratilgan, uzun. */
const MASTER_SELECT = {
  id: true,
  fullName: true,
  phoneNumber: true,
  photoUrl: true,
  experienceLevel: true,
  hasGovCertificate: true,
  ratingAvg: true,
  ratingCount: true,
  completedOrdersCount: true,
  status: true,
  isActive: true,
  userId: true,
  createdAt: true,
  profile: {
    select: {
      about: true,
      districts: true,
      workFrom: true,
      workTo: true,
      claimsCertificate: true,
      availableSince: true,
    },
  },
  categories: {
    where: { isEnabled: true },
    select: { category: { select: { name: true } } },
  },
  orders: {
    orderBy: { createdAt: 'desc' },
    take: ORDERS_LIMIT,
    select: {
      id: true,
      shortId: true,
      status: true,
      price: true,
      createdAt: true,
      category: { select: { name: true } },
    },
  },
  ratings: {
    orderBy: { createdAt: 'desc' },
    take: REVIEWS_LIMIT,
    select: {
      stars: true,
      comment: true,
      tags: true,
      createdAt: true,
      order: { select: { shortId: true } },
    },
  },
} satisfies Prisma.MasterSelect;

type MasterRow = Prisma.MasterGetPayload<{ select: typeof MASTER_SELECT }>;

const toDetail = (master: MasterRow, cancelled: number): AdminMasterDetail => ({
  id: master.id,
  fullName: master.fullName,
  // Roʻyxatda ham, tafsilotda ham raqam MASKALANGAN turadi — toʻliq
  // koʻrish alohida amal va u auditga yoziladi.
  phoneMasked: maskPhone(master.phoneNumber),
  isActive: master.isActive,
  status: master.status,
  experienceLevel: master.experienceLevel,
  hasGovCertificate: master.hasGovCertificate,
  photoUrl: master.photoUrl,
  ratingAvg: Number(master.ratingAvg),
  ratingCount: master.ratingCount,
  completedOrdersCount: master.completedOrdersCount,
  cancelledByMasterCount: cancelled,
  cancelRatePercent: cancelRatePercent({
    completedOrdersCount: master.completedOrdersCount,
    cancelledByMasterCount: cancelled,
  }),
  isOnShift: master.profile?.availableSince != null,
  userId: master.userId,
  createdAt: master.createdAt,
  profile: master.profile,
  categories: master.categories.map((item) => item.category.name),
  orders: master.orders.map((order) => ({
    id: order.id,
    shortId: order.shortId,
    status: order.status,
    price: order.price,
    categoryName: order.category?.name ?? null,
    createdAt: order.createdAt,
  })),
  reviews: master.ratings.map((rating) => ({
    orderShortId: rating.order.shortId,
    stars: rating.stars,
    comment: rating.comment,
    tags: rating.tags,
    createdAt: rating.createdAt,
  })),
});

@Injectable()
export class AdminMasterDetailService {
  constructor(private readonly prisma: PrismaService) {}

  async read(masterId: string): Promise<AdminMasterDetail> {
    const master = await this.prisma.master.findUnique({
      where: { id: masterId },
      select: MASTER_SELECT,
    });

    if (!master) throw new NotFoundException('Usta topilmadi');

    // Bekor qilishlar alohida sanaladi: `_count` shart boʻyicha filtrlay olmaydi.
    const cancelled = await this.prisma.order.count({
      where: { masterId, cancelledBy: CancelledBy.MASTER },
    });

    return toDetail(master, cancelled);
  }
}
