import { describe, expect, it } from 'vitest';
import { groupSecret, parseOtpauthUri } from './otpauth';

const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DP';
const URI = `otpauth://totp/Hizmat24:admin%40hizmat24.uz?secret=${SECRET}&issuer=Hizmat24`;

describe('parseOtpauthUri', () => {
  it('sir, hisob va tizim nomini ajratadi', () => {
    expect(parseOtpauthUri(URI)).toEqual({
      secret: SECRET,
      account: 'admin@hizmat24.uz',
      issuer: 'Hizmat24',
    });
  });

  it('issuer faqat yoʻlda boʻlsa ham topiladi', () => {
    const result = parseOtpauthUri(`otpauth://totp/Hizmat24:ops@hizmat24.uz?secret=${SECRET}`);

    expect(result?.issuer).toBe('Hizmat24');
    expect(result?.account).toBe('ops@hizmat24.uz');
  });

  it('ikki nuqtasiz yorliqni butunlay hisob nomi deb oladi', () => {
    const result = parseOtpauthUri(`otpauth://totp/admin@hizmat24.uz?secret=${SECRET}`);

    expect(result?.account).toBe('admin@hizmat24.uz');
    expect(result?.issuer).toBe('');
  });

  it('kichik harfdagi sirni katta harfga keltiradi', () => {
    expect(parseOtpauthUri(`otpauth://totp/A:b?secret=${SECRET.toLowerCase()}`)?.secret).toBe(
      SECRET,
    );
  });

  it.each([
    ['boʻsh satr', ''],
    ['havola emas', 'shunchaki matn'],
    ['boshqa sxema', `https://totp/A:b?secret=${SECRET}`],
    ['hotp turi', `otpauth://hotp/A:b?secret=${SECRET}&counter=1`],
    ['sirsiz', 'otpauth://totp/Hizmat24:admin@hizmat24.uz?issuer=Hizmat24'],
    ['boʻsh sir', 'otpauth://totp/A:b?secret='],
    ['juda qisqa sir', 'otpauth://totp/A:b?secret=JBSWY3DP'],
    ['base32 emas', 'otpauth://totp/A:b?secret=0189!!!!0189!!!!0189'],
    // `new URL()` buzuq foiz-kodlashni tozalamaydi — u yoʻlda qolib,
    // dekodlashda `URIError` otardi. Bu tur roʻyxatda boʻlmagani uchun
    // «istisno otilmaydi» vaʼdasi testlarda tasdiqlanmagan edi.
    ['buzuq foiz-kodlash', `otpauth://totp/Hiz%zz:b?secret=${SECRET}`],
    ['yarim qolgan koʻp baytli kod', `otpauth://totp/A:b%E0%A4?secret=${SECRET}`],
  ])('%s — null qaytaradi', (_name, raw) => {
    expect(parseOtpauthUri(raw)).toBeNull();
  });
});

describe('groupSecret', () => {
  it('toʻrtlikka boʻladi', () => {
    expect(groupSecret('ABCDEFGHIJKL')).toBe('ABCD EFGH IJKL');
  });

  it('oxirgi toʻliq boʻlmagan boʻlakni ham qoldiradi', () => {
    expect(groupSecret('ABCDEF')).toBe('ABCD EF');
  });

  it('boʻsh satrda boʻsh satr', () => {
    expect(groupSecret('')).toBe('');
  });
});
