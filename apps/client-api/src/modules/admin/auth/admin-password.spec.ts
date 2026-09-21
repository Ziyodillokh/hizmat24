import { randomBytes, scrypt } from 'node:crypto';
import { hashPassword, verifyPassword } from './admin-password';
import { LEAKED_PASSWORDS } from './password-policy';

describe('admin parolini hashlash', () => {
  const password = 'test-fikstura-parol-ishlatilmaydi';

  it('fikstura paroli haqiqiy hisobga hech qachon qoʻyila olmaydi', () => {
    // Bu qiymat testda ochiq yozilgan, demak u ommaviy. Fikstura bilan
    // taqiqlangan roʻyxat orasidagi bogʻ shu yerda mahkamlanadi: qiymat
    // oʻzgartirilsa-yu roʻyxat yangilanmasa, test qulaydi.
    expect(LEAKED_PASSWORDS).toContain(password);
  });

  it('toʻgʻri parolni tasdiqlaydi', async () => {
    expect(await verifyPassword(password, await hashPassword(password))).toBe(true);
  });

  it('notoʻgʻri parolni rad etadi', async () => {
    expect(await verifyPassword('boshqa-parol', await hashPassword(password))).toBe(false);
  });

  it('bir xil parol har safar BOSHQA hash beradi (tuz tasodifiy)', async () => {
    expect(await hashPassword(password)).not.toBe(await hashPassword(password));
  });

  it('parametrlarni hash satrida saqlaydi', async () => {
    expect(await hashPassword(password)).toMatch(/^scrypt\$32768\$8\$1\$[^$]+\$[^$]+$/);
  });

  it('eski parametrli hashni ham tekshira oladi (N kichikroq)', async () => {
    // Kelajakda N oshirilsa, BAZADAGI eski yozuvlar ishlashda davom etishi
    // kerak — aks holda parametr oshirilgan kuni hamma admin tizimdan
    // chiqib qolardi. Shuning uchun hash N=16384 bilan QOʻLDA quriladi.
    const salt = randomBytes(16);
    const key: Buffer = await new Promise((resolve, reject) => {
      scrypt(password, salt, 32, { N: 16_384, r: 8, p: 1 }, (error, derived) =>
        error ? reject(error) : resolve(derived),
      );
    });
    const legacy = `scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`;

    expect(await verifyPassword(password, legacy)).toBe(true);
    expect(await verifyPassword('boshqa-parol', legacy)).toBe(false);
  });

  it.each([
    ['boʻsh satr', ''],
    ['notanish algoritm', 'argon2$1$2$3$c2FsdA==$a2V5'],
    ['qismlari yetishmaydi', 'scrypt$32768$8$1$c2FsdA=='],
    ['sonlar oʻrnida matn', 'scrypt$x$y$z$c2FsdA==$a2V5'],
  ])('buzuq hashda (%s) qulamaydi, faqat false qaytaradi', async (_name, stored) => {
    expect(await verifyPassword(password, stored)).toBe(false);
  });

  it('Unicode parolni normallashtiradi — bir xil koʻringan ikki yozuv mos keladi', async () => {
    // "é" ikki xil kodlanadi: U+00E9 (tayyor belgi) va U+0065 U+0301 (harf +
    // urgʻu). Klaviatura qaysi birini berishi OSga bogʻliq — admin shu
    // sababli oʻz parolidan chiqib qolmasligi kerak.
    const composed = `par\u00E9l-2026-Hizmat`;
    const decomposed = `pare\u0301l-2026-Hizmat`;

    expect(composed).not.toBe(decomposed);
    expect(await verifyPassword(decomposed, await hashPassword(composed))).toBe(true);
  });
});
