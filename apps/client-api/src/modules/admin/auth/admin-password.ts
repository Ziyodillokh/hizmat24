import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/**
 * `promisify(scrypt)` bu yerda YARAMAYDI: u uch argumentli overloadni
 * tanlaydi va `options` ni oʻtkaza olmaydi — N/r/p sozlab boʻlmay qoladi.
 */
const scryptAsync = (password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });

/**
 * Admin paroli — `node:crypto` ning scrypt funksiyasi bilan.
 *
 * argon2 va bcrypt NATIV kutubxona talab qiladi: har bir Node yangilanishida
 * qayta qurish kerak va Docker imijida build-toolchain saqlashga majbur
 * qiladi. scrypt esa Node ning oʻzida, OWASP roʻyxatida bor va bu yerdagi
 * boshqa hamma joyda (OTP, refresh token) allaqachon `node:crypto` ishlatilgan.
 *
 * Parametrlar hash SATRINING ICHIDA saqlanadi. Ertaga N oshirilsa, eski
 * hashlar oʻz parametrlari bilan tekshirilaveradi — hech kim tizimdan
 * chiqib qolmaydi.
 */
const SCRYPT_N = 32_768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

/** scrypt N=32768, r=8 uchun 128·N·r = 32 MiB kerak; zaxira bilan ikki barobar. */
const MAX_MEMORY = 64 * 1024 * 1024;

const derive = (password: string, salt: Buffer, n: number, r: number, p: number) =>
  scryptAsync(password.normalize('NFKC'), salt, { N: n, r, p, maxmem: MAX_MEMORY });

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await derive(password, salt, SCRYPT_N, SCRYPT_R, SCRYPT_P);

  return [
    'scrypt',
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$');
}

/**
 * Parolni tekshiradi. Xato format yoki notoʻgʻri parol — bir xil `false`:
 * chaqiruvchi ikkisini ajratmasligi kerak, aks holda "bu hash buzuq" degan
 * javob hujumchiga maʼlumot berardi.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, rawN, rawR, rawP, rawSalt, rawKey] = parts;
  const n = Number(rawN);
  const r = Number(rawR);
  const p = Number(rawP);
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  const salt = Buffer.from(rawSalt, 'base64');
  const expected = Buffer.from(rawKey, 'base64');
  if (salt.length === 0 || expected.length !== KEY_LENGTH) return false;

  const actual = await derive(password, salt, n, r, p);
  return timingSafeEqual(actual, expected);
}
