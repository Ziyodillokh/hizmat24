const UZ_PHONE_PATTERN = /^\+998(9[0-9]|3[3]|8[8]|7[1]|2[0]|4[3]|5[05]|6[26]|7[0-9])\d{7}$/;

/** Kiritilgan raqamni E.164 (+998XXXXXXXXX) ko'rinishiga keltiradi. */
export function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`;

  return raw.trim();
}

export function isValidUzPhoneNumber(value: string): boolean {
  return UZ_PHONE_PATTERN.test(value);
}

/** Loglar uchun raqamni yashirish: +998901234567 → +99890***4567 */
export function maskPhoneNumber(value: string): string {
  return value.length <= 8 ? '***' : `${value.slice(0, 6)}***${value.slice(-4)}`;
}
