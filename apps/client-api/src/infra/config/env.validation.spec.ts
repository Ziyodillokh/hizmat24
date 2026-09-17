import { validateEnv } from './env.validation';

const BASE_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  OTP_HASH_SECRET: 'o'.repeat(32),
};

describe('validateEnv (TZ 9.7)', () => {
  it("toʻgʻri sozlamalarni standart qiymatlar bilan toʻldiradi", () => {
    const env = validateEnv(BASE_ENV);

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.SMS_PROVIDER).toBe('console');
  });

  it("DATABASE_URL boʻlmasa ilovani koʻtarmaydi", () => {
    expect(() => validateEnv({ ...BASE_ENV, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it('qisqa JWT secret ni rad etadi', () => {
    expect(() => validateEnv({ ...BASE_ENV, JWT_ACCESS_SECRET: 'qisqa' })).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it('production da OTP debug rejimini taqiqlaydi', () => {
    expect(() =>
      validateEnv({
        ...BASE_ENV,
        NODE_ENV: 'production',
        SMS_PROVIDER: 'eskiz',
        OTP_DEBUG_RETURN_CODE: 'true',
      }),
    ).toThrow(/production/);
  });

  it("FCM yoqilgan boʻlsa kalitlar borligini talab qiladi", () => {
    expect(() => validateEnv({ ...BASE_ENV, FCM_ENABLED: 'true' })).toThrow(/FCM_PROJECT_ID/);
  });

  it("FCM toʻliq sozlanganda muvaffaqiyatli oʻtadi", () => {
    const env = validateEnv({
      ...BASE_ENV,
      FCM_ENABLED: 'true',
      FCM_PROJECT_ID: 'project',
      FCM_CLIENT_EMAIL: 'sa@project.iam.gserviceaccount.com',
      FCM_PRIVATE_KEY: 'key',
    });

    expect(env.FCM_ENABLED).toBe(true);
  });

  it("notoʻgʻri LOG_LEVEL ni rad etadi", () => {
    expect(() => validateEnv({ ...BASE_ENV, LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });

  it('"false" matnini haqiqiy false deb o\'qiydi (z.coerce.boolean tuzog\'i)', () => {
    // Arrange & Act
    const env = validateEnv({
      ...BASE_ENV,
      FCM_ENABLED: 'false',
      OTP_DEBUG_RETURN_CODE: 'false',
    });

    // Assert: Boolean("false") === true bo'lgani uchun coerce ishlatilmaydi
    expect(env.FCM_ENABLED).toBe(false);
    expect(env.OTP_DEBUG_RETURN_CODE).toBe(false);
  });

  it.each([
    ['true', true],
    ['1', true],
    ['0', false],
    ['', false],
  ])('FCM_ENABLED=%s → %s', (raw, expected) => {
    const env = validateEnv({
      ...BASE_ENV,
      FCM_ENABLED: raw,
      FCM_PROJECT_ID: 'project',
      FCM_CLIENT_EMAIL: 'sa@project.iam.gserviceaccount.com',
      FCM_PRIVATE_KEY: 'key',
    });

    expect(env.FCM_ENABLED).toBe(expected);
  });

  it("boolean maydonga tushunarsiz qiymat berilsa ilovani koʻtarmaydi", () => {
    expect(() => validateEnv({ ...BASE_ENV, FCM_ENABLED: 'yes' })).toThrow(/FCM_ENABLED/);
  });

  it('OTP hashi uchun alohida sirni talab qiladi', () => {
    expect(() => validateEnv({ ...BASE_ENV, OTP_HASH_SECRET: undefined })).toThrow(
      /OTP_HASH_SECRET/,
    );
  });

  it("production da OTP siri JWT siri bilan bir xil boʻlishiga yoʻl qoʻymaydi", () => {
    expect(() =>
      validateEnv({
        ...BASE_ENV,
        NODE_ENV: 'production',
        SMS_PROVIDER: 'eskiz',
        OTP_HASH_SECRET: BASE_ENV.JWT_ACCESS_SECRET,
      }),
    ).toThrow(/OTP_HASH_SECRET/);
  });

  it('production da console SMS provayderini taqiqlaydi (kod logga ochiq tushadi)', () => {
    expect(() => validateEnv({ ...BASE_ENV, NODE_ENV: 'production' })).toThrow(/SMS_PROVIDER/);
  });
});
