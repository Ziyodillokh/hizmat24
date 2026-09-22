import type { RemoteApplication, SubmitApplicationPayload } from '@/api/masterApplication';
import { aboutHint, type MasterProfile } from './masterProfile';

/**
 * Usta arizasining SERVER yoʻli — sof funksiyalar.
 *
 * Ekran ikki narsani hal qilishi kerak: qanday payload ketadi va serverdan
 * kelgan holat foydalanuvchiga qanday koʻrsatiladi. Ikkalasi ham shu yerda,
 * React va tarmoqsiz — testda toʻliq yopiladi.
 */

/** Serverdagi chegaralar bilan bir xil (`application-rules.ts`). */
export const MAX_REQUESTED_CATEGORIES = 10;
export const MIN_FULL_NAME_LENGTH = 5;

export interface PayloadInput {
  profile: MasterProfile;
  fullName: string | null;
  requestedCategoryIds: readonly string[];
}

/**
 * Yuboriladigan maʼlumot; `null` — hali yuborib boʻlmaydi.
 *
 * Ism yoʻq yoki xizmat tanlanmagan boʻlsa ariza ketmaydi: server baribir
 * rad etardi, lekin foydalanuvchi buni tugma bosmasdan bilishi kerak.
 * Boshqa hech narsa soʻralmaydi — usta ariza uchun bitta ekrandan
 * nariga oʻtmaydi.
 */
export function toSubmitPayload(input: PayloadInput): SubmitApplicationPayload | null {
  if (submitBlocker(input) !== null) return null;

  const about = input.profile.about.trim();

  return {
    fullName: (input.fullName ?? '').trim().replace(/\s+/g, ' '),
    requestedCategoryIds: [...new Set(input.requestedCategoryIds)],
    // Boʻsh tanishtiruv umuman yuborilmaydi: boʻsh satr yuborilsa, server
    // «yozdim, lekin boʻsh» deb qabul qilardi.
    ...(about.length > 0 ? { about } : {}),
  };
}

/** Yuborish tugmasi nega yopiqligini aytadi; `null` — yuborish mumkin. */
export function submitBlocker(input: PayloadInput): string | null {
  const name = (input.fullName ?? '').trim();
  if (name.length < MIN_FULL_NAME_LENGTH || !name.includes(' ')) {
    return 'Ism va familiyangizni toʻliq yozing.';
  }
  if (input.requestedCategoryIds.length === 0) return 'Kamida bitta xizmat tanlang.';
  if (input.requestedCategoryIds.length > MAX_REQUESTED_CATEGORIES) {
    return `Bir arizada ${MAX_REQUESTED_CATEGORIES} tadan koʻp xizmat soʻralmaydi.`;
  }
  // Tanishtiruv ixtiyoriy, lekin yarim yozilgani server tomonidan rad
  // etilardi — buni tugma bosilgunicha aytamiz.
  return aboutHint(input.profile.about);
}

export type ApplicationView =
  | { kind: 'form' }
  | { kind: 'pending'; sentAt: string }
  | { kind: 'approved'; reviewedAt: string | null }
  | { kind: 'rejected'; reason: string; reviewedAt: string | null };

/**
 * Serverdagi holat → ekran.
 *
 * Rad etilgan ariza ham `rejected` koʻrinishida turadi, «form» emas:
 * odam avval SABABNI koʻrishi kerak, keyin qayta yuborishni oʻzi tanlaydi.
 * Sabab boʻsh kelsa (boʻlmasligi kerak, server majburiy qiladi) —
 * halol zaxira matn.
 */
export function toApplicationView(remote: RemoteApplication | null): ApplicationView {
  if (remote === null) return { kind: 'form' };

  switch (remote.status) {
    case 'PENDING':
      return { kind: 'pending', sentAt: remote.createdAt };
    case 'APPROVED':
      return { kind: 'approved', reviewedAt: remote.reviewedAt };
    case 'REJECTED':
      return {
        kind: 'rejected',
        reason: remote.rejectionReason?.trim() || 'Sabab koʻrsatilmagan.',
        reviewedAt: remote.reviewedAt,
      };
  }
}

/** Ekrandagi qisqa holat yorligʻi. */
export const VIEW_TITLES: Record<ApplicationView['kind'], string> = {
  form: 'Usta boʻlish uchun ariza',
  pending: 'Ariza koʻrib chiqilmoqda',
  approved: 'Ariza tasdiqlandi',
  rejected: 'Ariza rad etildi',
};
