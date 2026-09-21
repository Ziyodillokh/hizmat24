/**
 * `otpauth://` havolasini oʻqish.
 *
 * Havolani server yuboradi, lekin panel unga koʻr-koʻrona ishonmaydi:
 * sir topilmasa yoki havola buzuq boʻlsa, ekranda boʻsh katak emas,
 * `null` boʻyicha tushunarli xabar koʻrsatiladi. Shuning uchun bu mantiq
 * React dan ajratilgan — uni testda oʻnlab buzuq havola bilan tekshirish
 * mumkin.
 */

export interface OtpauthDetails {
  /** Base32 sir — autentifikator ilovasiga qoʻlda kiritiladigan kalit. */
  secret: string;
  /** Hisob nomi (odatda email) — telefonda yozuvni tanish uchun. */
  account: string;
  /** Tizim nomi — bir telefonda bir nechta TOTP boʻlsa ajratadi. */
  issuer: string;
}

/** Notoʻgʻri havolada `null` — istisno otilmaydi, chaqiruvchi tekshiradi. */
export function parseOtpauthUri(uri: string): OtpauthDetails | null {
  let parsed: URL;
  try {
    // `otpauth:` — "special" boʻlmagan sxema; `https:` ga almashtirilsa
    // barcha brauzerlar uni bir xil (host + path + query) tahlil qiladi.
    parsed = new URL(uri.replace(/^otpauth:\/\//i, 'https://'));
  } catch {
    return null;
  }

  if (!/^otpauth:\/\/totp\//i.test(uri)) return null;

  const secret = parsed.searchParams.get('secret')?.trim() ?? '';
  if (!/^[A-Z2-7]{16,}=*$/i.test(secret)) return null;

  // Yoʻl "Issuer:email" koʻrinishida boʻladi; ikki nuqtagacha boʻlgan
  // qismi issuer, qolgani hisob nomi.
  //
  // Dekodlash ATAYLAB himoyalangan: `new URL()` buzuq foiz-kodlashni
  // ("%zz" yoki yarim qolgan "%E0%A4") tozalamaydi, uni yoʻlda qoldiradi
  // va `decodeURIComponent` shunda `URIError` otadi. Panelda ErrorBoundary
  // yoʻq, demak bu istisno butun daraxtni yiqitib, admin kirish paytida
  // oq ekran koʻrardi — aynan shu funksiya oldini olishi kerak boʻlgan hol.
  let label: string;
  try {
    label = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  } catch {
    return null;
  }

  const separator = label.indexOf(':');

  return {
    secret: secret.toUpperCase(),
    account: separator === -1 ? label : label.slice(separator + 1),
    issuer: parsed.searchParams.get('issuer') ?? (separator === -1 ? '' : label.slice(0, separator)),
  };
}

/** Qoʻlda kiritish uchun sirni toʻrtlikka boʻladi: "ABCD EFGH …". */
export const groupSecret = (secret: string): string =>
  secret.replace(/(.{4})/g, '$1 ').trim();
