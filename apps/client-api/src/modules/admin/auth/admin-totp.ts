import { authenticator } from 'otplib';

/**
 * TOTP (RFC 6238) — `otplib` ustidagi yupqa qobiq.
 *
 * Qobiq ikki narsa uchun kerak: sozlamalar BITTA joyda turadi (aks holda
 * kod tekshiriladigan joy bilan yaratiladigan joy bir-biridan ogʻib
 * ketadi) va `otplib` ning istisno otish odati shu yerda `false` ga
 * aylantiriladi — notoʻgʻri kod xato emas, oddiy rad javobi.
 *
 * `window: 1` — bir oldingi va bir keyingi oyna qabul qilinadi (±30 s).
 * Telefon soati bir necha soniyaga ogʻishi normal holat; oynasiz TOTP
 * "kod notoʻgʻri" deb turib oladi va odam sababini topolmaydi.
 */
authenticator.options = { window: 1 };

export const generateTotpSecret = (): string => authenticator.generateSecret();

/**
 * Autentifikator ilovasi oʻqiydigan `otpauth://` havolasi.
 *
 * `issuer` va hisob nomi QR kodda koʻrinadi — admin telefonida oʻnta
 * yozuv boʻlsa, qaysi biri qaysi tizimniki ekani shu yerdan bilinadi.
 */
export const totpUri = (email: string, secret: string, issuer: string): string =>
  authenticator.keyuri(email, issuer, secret);

export function verifyTotp(token: string, secret: string): boolean {
  const normalized = token.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;

  try {
    return authenticator.verify({ token: normalized, secret });
  } catch {
    // Buzuq sir (base32 emas) — `otplib` istisno otadi. Bu ham rad javobi.
    return false;
  }
}
