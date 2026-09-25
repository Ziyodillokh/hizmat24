import { ComplexityLevel, type Prisma, ServicePriceKind } from '@prisma/client';
import type { UpsertCategoryDto } from './dto/catalog.dto';

/** Boʻsh satr — «qiymat yoʻq», boʻsh matn emas. */
export const orNull = (value: string | undefined): string | null => value?.trim() || null;

/**
 * Bosqichlarni Json ustuniga yoziladigan shaklga keltiradi.
 *
 * Boʻsh roʻyxat `null` emas, `[]` boʻlib saqlanadi: Prisma'ning
 * `DbNull`/`JsonNull` farqi bu yerda hech narsa bermaydi va oʻqishda
 * qoʻshimcha holat keltirardi.
 */
const toStepRows = (
  steps: readonly { title: string; description?: string }[],
): Prisma.InputJsonValue => steps.map((step) => ({ title: step.title, description: step.description ?? '' }));

const toFaqRows = (
  faq: readonly { question: string; answer: string }[],
): Prisma.InputJsonValue => faq.map((item) => ({ question: item.question, answer: item.answer }));

/**
 * Sahifa MAZMUNI — qisman yangilash uchun.
 *
 * Asosiy maydonlardan ataylab ajratilgan: ikkalasi bitta funksiyada
 * boʻlganda u oʻqib boʻlmas darajada uzayib ketdi va lint murakkablik
 * chegarasidan oshdi.
 */
function contentUpdate(dto: UpsertCategoryDto): Prisma.ServiceCategoryUncheckedUpdateInput {
  const data: Prisma.ServiceCategoryUncheckedUpdateInput = {};

  if (dto.steps !== undefined) data.steps = toStepRows(dto.steps);
  if (dto.faq !== undefined) data.faq = toFaqRows(dto.faq);
  if (dto.requirements !== undefined) data.requirements = dto.requirements;
  if (dto.highlights !== undefined) data.highlights = dto.highlights;
  if (dto.warrantyNote !== undefined) data.warrantyNote = orNull(dto.warrantyNote);
  if (dto.warrantyAmount !== undefined) data.warrantyAmount = dto.warrantyAmount;

  return data;
}

/** Sahifa mazmuni — yangi yozuv uchun. */
const contentCreate = (dto: UpsertCategoryDto) => ({
  steps: toStepRows(dto.steps ?? []),
  faq: toFaqRows(dto.faq ?? []),
  requirements: dto.requirements ?? [],
  highlights: dto.highlights ?? [],
  warrantyNote: orNull(dto.warrantyNote),
  warrantyAmount: dto.warrantyAmount ?? null,
});

/**
 * `description` `summary` dan nusxalanadi.
 *
 * Eski maydon ilovaning hozirgi versiyalarida ishlatiladi; yangi
 * `summary` uning oʻrnini bosadi. Ikkovini bir vaqtda yozib turamiz —
 * eski APK oʻrnatilgan telefonlarda karta boʻsh qolmasin.
 */
/**
 * PATCH — QISMAN yangilash: faqat yuborilgan maydonlar tegadi.
 *
 * Ilgari bu yerda ham `toData` ishlatilardi va u yuborilmagan maydonni
 * standart qiymatga tushirardi. Jonli serverda bu koʻrindi: guruhsiz
 * yuborilgan PATCH xizmatni guruhdan chiqarib yubordi va u mijoz
 * katalogidan butunlay yoʻqoldi (mijoz endpointi guruhlar boʻyicha
 * oʻqiydi). Qiymatni TOZALASH uchun uni ataylab `null`/boʻsh qilib
 * yuborish kerak — jim tushib qolish emas.
 */
export function toUpdateData(dto: UpsertCategoryDto): Prisma.ServiceCategoryUncheckedUpdateInput {
  const data: Prisma.ServiceCategoryUncheckedUpdateInput = { name: dto.name, basePrice: dto.basePrice };

  if (dto.summary !== undefined) {
    data.summary = orNull(dto.summary);
    // Eski maydon ilovaning hozirgi versiyalarida ishlatiladi.
    data.description = orNull(dto.summary);
  }
  if (dto.details !== undefined) data.details = orNull(dto.details);
  if (dto.includes !== undefined) data.includes = dto.includes;
  if (dto.excludes !== undefined) data.excludes = dto.excludes;
  if (dto.priceKind !== undefined) data.priceKind = dto.priceKind;
  if (dto.durationMinutes !== undefined) data.durationMinutes = dto.durationMinutes;
  if (dto.complexityLevel !== undefined) data.complexityLevel = dto.complexityLevel;
  if (dto.groupId !== undefined) data.groupId = dto.groupId;
  if (dto.iconKey !== undefined) data.iconKey = orNull(dto.iconKey);
  if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
  if (dto.isActive !== undefined) data.isActive = dto.isActive;
  return { ...data, ...contentUpdate(dto) };
}

export function toData(dto: UpsertCategoryDto): Prisma.ServiceCategoryUncheckedCreateInput {
  const summary = orNull(dto.summary);

  return {
    name: dto.name,
    summary,
    description: summary,
    details: orNull(dto.details),
    includes: dto.includes ?? [],
    excludes: dto.excludes ?? [],
    basePrice: dto.basePrice,
    priceKind: dto.priceKind ?? ServicePriceKind.FIXED,
    durationMinutes: dto.durationMinutes ?? null,
    complexityLevel: dto.complexityLevel ?? ComplexityLevel.SIMPLE,
    groupId: dto.groupId ?? null,
    iconKey: orNull(dto.iconKey),
    sortOrder: dto.sortOrder ?? 0,
    isActive: dto.isActive ?? true,
    ...contentCreate(dto),
  };
}


