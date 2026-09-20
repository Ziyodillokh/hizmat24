import { authenticator } from 'otplib';
import { generateTotpSecret, totpUri, verifyTotp } from './admin-totp';

describe('admin TOTP', () => {
  const secret = generateTotpSecret();

  it('hozirgi kodni qabul qiladi', () => {
    expect(verifyTotp(authenticator.generate(secret), secret)).toBe(true);
  });

  it('boshqa sirning kodini rad etadi', () => {
    expect(verifyTotp(authenticator.generate(generateTotpSecret()), secret)).toBe(false);
  });

  it('boʻshliqlarni tashlab yuboradi — "123 456" ham ishlaydi', () => {
    const token = authenticator.generate(secret);
    const spaced = `${token.slice(0, 3)} ${token.slice(3)}`;

    expect(verifyTotp(spaced, secret)).toBe(true);
  });

  it.each([
    ['qisqa', '12345'],
    ['uzun', '1234567'],
    ['harf bilan', '12a456'],
    ['boʻsh', ''],
  ])('shakli notoʻgʻri kodni (%s) rad etadi', (_name, token) => {
    expect(verifyTotp(token, secret)).toBe(false);
  });

  it('buzuq sirda istisno otmaydi, false qaytaradi', () => {
    expect(verifyTotp('123456', 'bu-base32-emas!!!')).toBe(false);
  });

  it('otpauth havolasi hisob va issuerni oʻz ichiga oladi', () => {
    const uri = totpUri('admin@hizmat24.uz', secret, 'Hizmat24');

    expect(uri.startsWith('otpauth://totp/')).toBe(true);
    expect(uri).toContain('issuer=Hizmat24');
    expect(uri).toContain(`secret=${secret}`);
  });

  it('har chaqiruvda yangi sir beradi', () => {
    expect(generateTotpSecret()).not.toBe(generateTotpSecret());
  });
});
