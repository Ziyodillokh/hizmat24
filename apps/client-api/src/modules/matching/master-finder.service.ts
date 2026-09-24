import { Injectable } from '@nestjs/common';
import { ComplexityLevel, Prisma } from '@prisma/client';
import { MATCHING_CANDIDATE_LIMIT, MATCHING_RADIUS_KM } from '@shared/index';
import { PrismaService } from '@client/infra/prisma/prisma.service';

export interface MasterCandidate {
  id: string;
  /** Koordinatasiz buyurtmada masofa nomaʼlum — `null`, nol emas. */
  distance_km: number | null;
}

export interface FindCandidatesInput {
  /** Rad etgan ustalarni chetlab oʻtish uchun kerak. */
  orderId: string;
  categoryId: string;
  complexityLevel: ComplexityLevel;
  /** Manzil koordinatasi; ilovada xarita yoʻq boʻlgani uchun `null` boʻlishi mumkin. */
  lat: number | null;
  lng: number | null;
  radiusKm?: number;
  limit?: number;
  /** Bu ustalar chetlab oʻtiladi (masalan, shu buyurtmani allaqachon rad etganlar). */
  excludeMasterIds?: string[];
}

/** Haversine masofasi (km) — SQL ichida, shunda tartiblash ham DB tomonida bo'ladi. */
const DISTANCE_KM_SQL = `
  (6371 * 2 * asin(sqrt(
    power(sin(radians($2::float8 - m.last_lat) / 2), 2)
    + cos(radians(m.last_lat)) * cos(radians($2::float8))
    * power(sin(radians($3::float8 - m.last_lng) / 2), 2)
  )))`;

/**
 * Ochiq RAD ETGAN ustani chetlab oʻtish.
 *
 * Joriy urinishdagi istisno roʻyxati (`excludeMasterIds`) yetarli emas:
 * rejalashtiruvchi har 10 soniyada qidiruvni QAYTADAN boshlaydi va u
 * roʻyxat unda yoʻq. Rad etish esa yozuv sifatida qoladi.
 */
const NOT_DECLINED_SQL = `
    AND NOT EXISTS (
      SELECT 1 FROM order_master_declines d
      WHERE d.order_id = $ORDER::uuid AND d.master_id = m.id
    )`;

/**
 * $1 categoryId, $2 lat, $3 lng, $4 requireExperienced,
 * $5 radiusKm, $6 excludedMasterIds, $7 limit, $8 orderId
 */
const FIND_CANDIDATES_SQL = `
  SELECT m.id, ${DISTANCE_KM_SQL} AS distance_km
  FROM masters m
  JOIN master_service_categories msc ON msc.master_id = m.id
  WHERE msc.category_id = $1::uuid
    -- Usta oʻchirib qoʻygan ish unga TUSHMAYDI (u buni profilidan boshqaradi).
    AND msc.is_enabled = true
    AND m.is_active = true
    AND m.status = 'AVAILABLE'
    AND m.last_lat IS NOT NULL
    AND m.last_lng IS NOT NULL
    AND ($4::boolean = false OR m.experience_level = 'EXPERIENCED')
    AND ${DISTANCE_KM_SQL} <= $5::float8
    AND ($6::uuid[] IS NULL OR m.id <> ALL($6::uuid[]))${NOT_DECLINED_SQL.replace('$ORDER', '$8')}
  ORDER BY distance_km ASC, m.rating_avg DESC
  LIMIT $7::int
  FOR UPDATE OF m SKIP LOCKED`;

/**
 * Koordinatasiz buyurtma uchun ikkinchi yoʻl.
 *
 * Manzil koordinatasi boʻlmasa masofani hisoblab boʻlmaydi — soxta nuqta
 * qoʻyish taqiqlanadi (TZ 2-bo'lim). Shu sababli radius filtri UMUMAN
 * qoʻllanmaydi va nomzodlar reyting boʻyicha tartiblanadi; masofa `NULL`
 * qaytadi, ya'ni ETA ham hisoblanmaydi va ekranda taxminiy raqam chiqmaydi.
 *
 * $1 categoryId, $2 requireExperienced, $3 excludedMasterIds, $4 limit, $5 orderId
 */
const FIND_CANDIDATES_WITHOUT_LOCATION_SQL = `
  SELECT m.id, NULL::float8 AS distance_km
  FROM masters m
  JOIN master_service_categories msc ON msc.master_id = m.id
  WHERE msc.category_id = $1::uuid
    -- Usta oʻchirib qoʻygan ish unga TUSHMAYDI (u buni profilidan boshqaradi).
    AND msc.is_enabled = true
    AND m.is_active = true
    AND m.status = 'AVAILABLE'
    AND ($2::boolean = false OR m.experience_level = 'EXPERIENCED')
    AND ($3::uuid[] IS NULL OR m.id <> ALL($3::uuid[]))${NOT_DECLINED_SQL.replace('$ORDER', '$5')}
  ORDER BY m.rating_avg DESC, m.completed_orders_count DESC
  LIMIT $4::int
  FOR UPDATE OF m SKIP LOCKED`;

@Injectable()
export class MasterFinderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mos ustalarni masofa boʻyicha tartiblab qaytaradi va ularni tranzaksiya
   * davomida bloklaydi (`FOR UPDATE ... SKIP LOCKED`) — shu sababli ikkita
   * parallel buyurtma bitta ustaga tushmaydi (TZ 9.5, 7.3).
   *
   * MUHIM (biznes-qoida 5.3): `COMPLEX` kategoriyada `NEW` darajali ustalar
   * SQL darajasida chiqarib tashlanadi — frontendga ishonilmaydi.
   */
  findCandidates(
    tx: Prisma.TransactionClient,
    input: FindCandidatesInput,
  ): Promise<MasterCandidate[]> {
    const excluded = input.excludeMasterIds ?? [];
    const excludedParam = excluded.length > 0 ? excluded : null;
    const requireExperienced = input.complexityLevel === ComplexityLevel.COMPLEX;

    if (input.lat === null || input.lng === null) {
      return tx.$queryRawUnsafe<MasterCandidate[]>(
        FIND_CANDIDATES_WITHOUT_LOCATION_SQL,
        input.categoryId,
        requireExperienced,
        excludedParam,
        input.limit ?? MATCHING_CANDIDATE_LIMIT,
        input.orderId,
      );
    }

    return tx.$queryRawUnsafe<MasterCandidate[]>(
      FIND_CANDIDATES_SQL,
      input.categoryId,
      input.lat,
      input.lng,
      requireExperienced,
      input.radiusKm ?? MATCHING_RADIUS_KM,
      excludedParam,
      input.limit ?? MATCHING_CANDIDATE_LIMIT,
      input.orderId,
    );
  }

  /** Kategoriyadagi faol ustalar soni — navbat kutish vaqtini baholash uchun. */
  countActiveMastersInCategory(categoryId: string): Promise<number> {
    return this.prisma.master.count({
      where: {
        isActive: true,
        status: { not: 'OFFLINE' },
        categories: { some: { categoryId, isEnabled: true } },
      },
    });
  }
}
