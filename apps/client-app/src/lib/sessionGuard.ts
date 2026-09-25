/**
 * Sessiya holati va undan kelib chiqadigan qaror — sof mantiq.
 *
 * MUAMMO shu yerdan chiqqan edi: «kirganmi» degan bayroq alohida
 * saqlangan seans kalitidan oʻqilardi, token esa faqat XOTIRADA yashaydi
 * va har ochilishda `refresh` dan qayta olinadi. Token tiklanmasa ham
 * bayroq `true` boʻlib qolaverar, ilova toʻliq ochilar va HAR BIR soʻrov
 * 401 qaytarardi — foydalanuvchi «usta chaqirish» tugmasini bosib,
 * sababsiz «unauthorized» xatosini koʻrardi.
 */
export type SessionOutcome =
  /** Hali tekshirilmoqda — soʻrov yuborilmaydi. */
  | 'pending'
  /** Token bor; yoki server ulanmagan va mahalliy seans oʻzi yetarli. */
  | 'active'
  /** Saqlangan token yoʻq yoki server uni RAD ETDI — qaytadan kirish kerak. */
  | 'expired'
  /** Server javob bermadi — seans saqlanadi, keyin qayta urinamiz. */
  | 'offline';

/**
 * Foydalanuvchini chiqarish kerakmi.
 *
 * Uch shart BIRGA: sessiya yaroqsiz, ilova oʻzini kirgan deb hisoblaydi
 * VA tokenning oʻzi ham yoʻq.
 *
 * `hasToken` SHART. `outcome` ilova ishga tushganda BIR MARTA
 * hisoblanadi va kirish tugagach ham `expired` boʻlib qoladi — usiz
 * foydalanuvchi SMS kodini kiritishi bilan darhol chiqarib yuborilardi.
 * Token esa kirish paytida oʻrnatiladi va haqiqiy holatni koʻrsatadi.
 *
 * Tarmoq uzilishi sabab boʻlmaydi: bir lahzalik uzilish uchun odamni
 * chiqarib yuborish va qaytadan SMS soʻrash — eng yomon javob.
 */
export const shouldSignOut = (
  outcome: SessionOutcome,
  isAuthenticated: boolean,
  hasToken: boolean,
): boolean => outcome === 'expired' && isAuthenticated && !hasToken;

/**
 * Serverga soʻrov yuborsa boʻladimi.
 *
 * `pending` da yuborilmaydi: token hali yoʻq va soʻrov 401 bilan
 * qaytardi.
 */
export const isRestoreSettled = (outcome: SessionOutcome): boolean => outcome !== 'pending';

/** Eski `boolean | null` shartnomasi — mavjud ekranlar shuni kutadi. */
export const toReadyFlag = (outcome: SessionOutcome): boolean | null =>
  outcome === 'pending' ? null : outcome === 'active';
