/**
 * Ariza tasdiqlanganda usta yozuvi bilan nima qilish kerakligini
 * hal qiladi — sof mantiq, bazaga tegmaydi.
 *
 * NEGA alohida: bu yerda uchta yoʻl bor va ikkitasi rad javobi. Shu qaror
 * tranzaksiya ichiga yozilsa, uni faqat haqiqiy baza bilan sinab koʻrish
 * mumkin boʻlardi; bu yerda esa har bir holat bitta test qatori.
 */

export interface ExistingMaster {
  readonly id: string;
  readonly userId: string | null;
}

export type MasterLinkDecision =
  /** Usta yozuvi yoʻq — yangisi yaratiladi. */
  | { readonly kind: 'create' }
  /** Eski, qoʻlda kiritilgan usta topildi — ilova hisobi unga ulanadi. */
  | { readonly kind: 'link'; readonly masterId: string }
  | { readonly kind: 'conflict'; readonly code: MasterLinkConflict };

export type MasterLinkConflict =
  /** Foydalanuvchi allaqachon usta — ikkinchi hisob ochilmaydi. */
  | 'ALREADY_MASTER'
  /** Telefon boshqa odamning usta hisobiga biriktirilgan. */
  | 'PHONE_TAKEN';

export function decideMasterLink(input: {
  readonly byUser: ExistingMaster | null;
  readonly byPhone: ExistingMaster | null;
}): MasterLinkDecision {
  const { byUser, byPhone } = input;

  // Foydalanuvchining usta hisobi bor. Ayni oʻsha yozuv telefon boʻyicha
  // ham topilgan boʻlsa — bu takroriy ariza; boshqasi topilsa — maʼlumot
  // chalkash. Ikkala holatda ham avtomatik qaror qabul qilinmaydi.
  if (byUser) return { kind: 'conflict', code: 'ALREADY_MASTER' };

  if (!byPhone) return { kind: 'create' };

  // Telefon egasi boshqa ilova hisobiga bogʻlangan: raqam qoʻldan qoʻlga
  // oʻtgan yoki notoʻgʻri kiritilgan. Buni odam hal qiladi.
  if (byPhone.userId !== null) return { kind: 'conflict', code: 'PHONE_TAKEN' };

  return { kind: 'link', masterId: byPhone.id };
}
