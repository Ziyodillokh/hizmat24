import type { RemoteApplication, SubmitApplicationPayload } from '@/api/masterApplication';
import { isMasterProfileComplete, type MasterProfile } from './masterProfile';

/**
 * Usta arizasining SERVER yoʻli — sof funksiyalar.
 *
 * Ekran ikki narsani hal qilishi kerak: qanday payload ketadi va serverdan
 * kelgan holat foydalanuvchiga qanday koʻrsatiladi. Ikkalasi ham shu yerda,
 * React va tarmoqsiz — testda toʻliq yopiladi.
 */

/** Serverdagi chegara bilan bir xil. */
export const MAX_REQUESTED_CATEGORIES = 10;

export interface PayloadInput {
  profile: MasterProfile;
  fullName: string | null;
  requestedCategoryIds: readonly string[];
}

/**
 * Yuboriladigan maʼlumot; `null` — hali yuborib boʻlmaydi.
 *
 * Profil toʻliq boʻlmasa yoki xizmat tanlanmagan boʻlsa ariza ketmaydi:
 * server baribir rad etardi, lekin foydalanuvchi buni tugma bosmasdan
 * bilishi kerak.
 */
export function toSubmitPayload(input: PayloadInput): SubmitApplicationPayload | null {
  const { profile, fullName, requestedCategoryIds } = input;
  const name = (fullName ?? '').trim();

  if (!isMasterProfileComplete(profile) || name.length === 0) return null;
  if (profile.profession === null || profile.experienceLevel === null) return null;
  if (requestedCategoryIds.length === 0 || requestedCategoryIds.length > MAX_REQUESTED_CATEGORIES) {
    return null;
  }

  return {
    fullName: name,
    profession: profile.profession,
    experienceLevel: profile.experienceLevel,
    claimsCertificate: profile.claimsCertificate,
    about: profile.about.trim(),
    districts: [...profile.districts],
    workFrom: profile.workFrom,
    workTo: profile.workTo,
    requestedCategoryIds: [...new Set(requestedCategoryIds)],
  };
}

/** Yuborish tugmasi nega yopiqligini aytadi; `null` — yuborish mumkin. */
export function submitBlocker(input: PayloadInput): string | null {
  if (!isMasterProfileComplete(input.profile)) return 'Avval profilni toʻldiring.';
  if ((input.fullName ?? '').trim().length === 0) return 'Ismingizni kiriting — u arizada koʻrinadi.';
  if (input.requestedCategoryIds.length === 0) return 'Kamida bitta xizmat tanlang.';
  if (input.requestedCategoryIds.length > MAX_REQUESTED_CATEGORIES) {
    return `Bir arizada ${MAX_REQUESTED_CATEGORIES} tadan koʻp xizmat soʻralmaydi.`;
  }
  return null;
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
