import type { ApplicationStatus } from '@/api/admin';

/**
 * Usta arizalari boʻlimining sof mantiqi — React yoʻq, tarmoq yoʻq.
 *
 * Bu yerda faqat KOʻRSATISH qoidalari: yorliqlar, filtr, tekshiruvlar.
 * Arizaning oʻzini oʻzgartiradigan qarorlar (tasdiqlash mumkinmi,
 * kim tasdiqlaydi) SERVERDA — panel ularni takrorlamaydi, aks holda
 * ikki joy bir-biridan ogʻib ketardi.
 */

/** Rad etish sababi chegaralari — server DTO si bilan bir xil. */
export const REJECTION_REASON_MIN = 10;
export const REJECTION_REASON_MAX = 500;

/** Bir arizaga biriktiriladigan xizmatlar chegarasi — server bilan bir xil. */
export const CATEGORIES_MIN = 1;
export const CATEGORIES_MAX = 10;

export type StatusFilter = ApplicationStatus | 'ALL';

export const STATUS_FILTERS: ReadonlyArray<{ key: StatusFilter; label: string }> = [
  { key: 'PENDING', label: 'Kutilmoqda' },
  { key: 'APPROVED', label: 'Tasdiqlangan' },
  { key: 'REJECTED', label: 'Rad etilgan' },
  { key: 'ALL', label: 'Hammasi' },
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Kutilmoqda',
  APPROVED: 'Tasdiqlangan',
  REJECTED: 'Rad etilgan',
};

export const STATUS_TONES: Record<ApplicationStatus, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

export const EXPERIENCE_LABELS: Record<string, string> = {
  NEW: 'Yangi usta',
  EXPERIENCED: 'Tajribali usta',
};

/**
 * Rad etish sababini tekshiradi. `null` — yaroqli; aks holda foydalanuvchiga
 * koʻrsatiladigan matn. Server ham tekshiradi — bu yerdagisi faqat
 * tugma bosilmasdan oldin sababni aytish uchun.
 */
export function rejectionReasonProblem(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length === 0) return 'Rad etish sababi majburiy — u usta ilovasida koʻrinadi.';
  if (trimmed.length < REJECTION_REASON_MIN) {
    return `Sabab kamida ${REJECTION_REASON_MIN} belgidan iborat boʻlsin — hozir ${trimmed.length} ta.`;
  }
  if (trimmed.length > REJECTION_REASON_MAX) {
    return `Sabab ${REJECTION_REASON_MAX} belgidan uzun boʻlmasin — hozir ${trimmed.length} ta.`;
  }
  return null;
}

/** Tanlangan xizmatlar soni chegaraga sigʻadimi. */
export function categorySelectionProblem(selectedCount: number): string | null {
  if (selectedCount < CATEGORIES_MIN) return 'Kamida bitta xizmat tanlang.';
  if (selectedCount > CATEGORIES_MAX) return `Bir ustaga ${CATEGORIES_MAX} tadan koʻp xizmat biriktirilmaydi.`;
  return null;
}

/** Roʻyxatdagi id ni qoʻshadi yoki olib tashlaydi — yangi massiv qaytaradi. */
export function toggleId(selected: readonly string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
}

/**
 * "08:00 – 18:00" yoki tungi smena uchun "22:00 – 06:00 (tunda)".
 * Soatlar 0–23 oraligʻida; server shuni kafolatlaydi.
 */
export function formatWorkHours(from: number, to: number): string {
  const pad = (hour: number) => `${String(hour).padStart(2, '0')}:00`;
  const base = `${pad(from)} – ${pad(to)}`;
  return to <= from ? `${base} (tunda)` : base;
}

/**
 * Tumanlarni bitta qatorda koʻrsatadi; boʻsh boʻlsa buni ochiq aytadi —
 * boʻsh joy «hamma joyda ishlaydi» degan notoʻgʻri maʼno berardi.
 */
export function formatDistricts(districts: readonly string[]): string {
  return districts.length === 0 ? 'Tuman koʻrsatilmagan' : districts.join(', ');
}
