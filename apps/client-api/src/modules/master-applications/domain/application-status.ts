import { MasterApplicationStatus } from '@prisma/client';

/**
 * Ariza holatlari oʻrtasidagi ruxsat etilgan oʻtishlar — sof mantiq.
 *
 * Yagona manba: xizmat oʻzi `if (status !== PENDING)` deb yozsa, keyin
 * ikkinchi joyda (masalan arizani bekor qilishda) shart takrorlanar va
 * ikkalasi vaqt oʻtib bir-biridan uzoqlashardi.
 */
const ALLOWED: Record<MasterApplicationStatus, readonly MasterApplicationStatus[]> = {
  // Koʻrib chiqilgan ariza QAYTA ochilmaydi: moderator xato qilgan boʻlsa,
  // odam yangi ariza yuboradi va tarixda ikkala qaror ham koʻrinib turadi.
  [MasterApplicationStatus.PENDING]: [
    MasterApplicationStatus.APPROVED,
    MasterApplicationStatus.REJECTED,
  ],
  [MasterApplicationStatus.APPROVED]: [],
  [MasterApplicationStatus.REJECTED]: [],
};

export function canTransition(from: MasterApplicationStatus, to: MasterApplicationStatus): boolean {
  return ALLOWED[from].includes(to);
}

/** Yakuniy holat — bundan keyin ariza oʻzgarmaydi. */
export function isFinal(status: MasterApplicationStatus): boolean {
  return ALLOWED[status].length === 0;
}
