import { Injectable } from '@nestjs/common';
import { ComplexityLevel, Prisma } from '@prisma/client';
import { MATCHING_CANDIDATE_LIMIT, MATCHING_RADIUS_KM } from '@shared/index';
import { PrismaService } from '@client/infra/prisma/prisma.service';

export interface MasterCandidate {
  id: string;
  distance_km: number;
}

export interface FindCandidatesInput {
  categoryId: string;
  complexityLevel: ComplexityLevel;
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
  /** Bu ustalar chetlab o'tiladi (masalan, shu buyurtmani allaqachon rad etganlar). */
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
 * $1 categoryId, $2 lat, $3 lng, $4 requireExperienced,
 * $5 radiusKm, $6 excludedMasterIds, $7 limit
 */
const FIND_CANDIDATES_SQL = `
  SELECT m.id, ${DISTANCE_KM_SQL} AS distance_km
  FROM masters m
  JOIN master_service_categories msc ON msc.master_id = m.id
  WHERE msc.category_id = $1::uuid
    AND m.is_active = true
    AND m.status = 'AVAILABLE'
    AND m.last_lat IS NOT NULL
    AND m.last_lng IS NOT NULL
    AND ($4::boolean = false OR m.experience_level = 'EXPERIENCED')
    AND ${DISTANCE_KM_SQL} <= $5::float8
    AND ($6::uuid[] IS NULL OR m.id <> ALL($6::uuid[]))
  ORDER BY distance_km ASC, m.rating_avg DESC
  LIMIT $7::int
  FOR UPDATE OF m SKIP LOCKED`;

@Injectable()
export class MasterFinderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mos ustalarni masofa bo'yicha tartiblab qaytaradi va ularni tranzaksiya
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

    return tx.$queryRawUnsafe<MasterCandidate[]>(
      FIND_CANDIDATES_SQL,
      input.categoryId,
      input.lat,
      input.lng,
      input.complexityLevel === ComplexityLevel.COMPLEX,
      input.radiusKm ?? MATCHING_RADIUS_KM,
      excluded.length > 0 ? excluded : null,
      input.limit ?? MATCHING_CANDIDATE_LIMIT,
    );
  }

  /** Kategoriyadagi faol ustalar soni — navbat kutish vaqtini baholash uchun. */
  countActiveMastersInCategory(categoryId: string): Promise<number> {
    return this.prisma.master.count({
      where: {
        isActive: true,
        status: { not: 'OFFLINE' },
        categories: { some: { categoryId } },
      },
    });
  }
}
