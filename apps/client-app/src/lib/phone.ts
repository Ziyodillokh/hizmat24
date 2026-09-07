/** Oʻzbekiston raqamining operator+abonent qismi: 9 ta raqam. */
export const PHONE_DIGITS = 9;

/** Mamlakat kodi — maydonda alohida, oʻzgarmas boʻlak sifatida chiziladi. */
export const COUNTRY_CODE = '+998';

/** Faqat raqamlarni qoldiradi va uzunlikni cheklaydi. */
export const toPhoneDigits = (value: string): string =>
  value.replace(/\D/g, '').slice(0, PHONE_DIGITS);

/**
 * "90 123 45 67" — 2-3-2-2 guruhlash.
 *
 * Guruhlash kiritish paytida ham qoʻllanadi: uzluksiz toʻqqizta raqamni
 * koʻz bilan tekshirib boʻlmaydi va foydalanuvchi xatosini sezmaydi.
 */
export function formatPhoneDigits(digits: string): string {
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)];
  return groups.filter(Boolean).join(' ');
}

/** "+998 90 *** ** 67" — tasdiqlash ekranida raqamni qisman yashirish. */
export function maskPhoneDigits(digits: string): string {
  if (digits.length < PHONE_DIGITS) return `${COUNTRY_CODE} ${formatPhoneDigits(digits)}`;
  return `${COUNTRY_CODE} ${digits.slice(0, 2)} *** ** ${digits.slice(7, 9)}`;
}
