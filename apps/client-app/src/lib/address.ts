import type { OrderAddress } from '@/mocks/types';

/**
 * Manzil tafsilotlari bitta qatorda: "2-podez · 5-qavat · 34-xonadon".
 *
 * Raqamlar yorliqsiz berilsa "2 · 5 · 34" maʼnosiz oʻqiladi. Mantiq ilgari
 * buyurtma tasdiqlash ekranida ichma-ich yozilgan edi; endi bitta joyda va
 * test bilan qoplangan.
 *
 * `comment` ATAYLAB kirmaydi: u erkin matn va uzun boʻlishi mumkin, bir
 * qatorli tafsilot bilan aralashmaydi.
 */
export function addressDetailsLine(address: OrderAddress): string | null {
  const parts = [
    address.entrance && `${address.entrance}-podez`,
    address.floor && `${address.floor}-qavat`,
    address.apartment && `${address.apartment}-xonadon`,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(' · ') : null;
}
