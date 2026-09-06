import { UserStatus } from '@prisma/client';
import { OTP_RESEND_COOLDOWN_MS } from '@shared/index';
import { AuthService } from './auth.service';

const CONFIG: Record<string, unknown> = {
  JWT_ACCESS_SECRET: 'test-secret-that-is-at-least-32-chars',
  OTP_HASH_SECRET: 'otp-hash-secret-that-is-32-chars-min',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_TTL_DAYS: 30,
  OTP_DEBUG_RETURN_CODE: false,
  SMS_PROVIDER: 'console',
};

describe('AuthService (TZ 3.1, 6.3)', () => {
  let service: AuthService;
  let otpFindFirst: jest.Mock;
  let otpCreate: jest.Mock;
  let otpUpdateMany: jest.Mock;
  let userUpsert: jest.Mock;
  let refreshCreate: jest.Mock;
  let refreshFindUnique: jest.Mock;
  let refreshUpdateMany: jest.Mock;
  let refreshUpdate: jest.Mock;
  let sendOtp: jest.Mock;

  const activeUser = {
    id: 'user-1',
    phoneNumber: '+998901234567',
    fullName: null,
    status: UserStatus.ACTIVE,
    defaultAddress: null,
  };

  beforeEach(() => {
    otpFindFirst = jest.fn().mockResolvedValue(null);
    otpCreate = jest.fn().mockResolvedValue({ id: 'otp-1' });
    otpUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    userUpsert = jest.fn().mockResolvedValue(activeUser);
    refreshCreate = jest.fn().mockResolvedValue({ id: 'refresh-1' });
    refreshFindUnique = jest.fn().mockResolvedValue(null);
    refreshUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    refreshUpdate = jest.fn().mockResolvedValue({});
    sendOtp = jest.fn().mockResolvedValue(undefined);

    const prisma = {
      otpRequest: { findFirst: otpFindFirst, create: otpCreate, updateMany: otpUpdateMany },
      user: { upsert: userUpsert, findUnique: jest.fn().mockResolvedValue(activeUser) },
      refreshToken: {
        create: refreshCreate,
        findUnique: refreshFindUnique,
        updateMany: refreshUpdateMany,
        update: refreshUpdate,
      },
    };

    const jwt = { signAsync: jest.fn().mockResolvedValue('access-token') };
    const config = { get: (key: string) => CONFIG[key] };

    service = new AuthService(
      prisma as never,
      jwt as never,
      config as never,
      {
        sendOtp,
      } as never,
    );
  });

  describe('requestOtp', () => {
    it('kodni yaratib SMS orqali yuboradi', async () => {
      // Act
      const result = await service.requestOtp('+998901234567');

      // Assert
      expect(sendOtp).toHaveBeenCalledWith('+998901234567', expect.stringMatching(/^\d{6}$/));
      expect(result.sent).toBe(true);
      expect(result.debugCode).toBeUndefined();
    });

    it('kodni ochiq holda saqlamaydi (faqat hash)', async () => {
      await service.requestOtp('+998901234567');

      const savedCode = sendOtp.mock.calls[0][1] as string;
      const savedHash = otpCreate.mock.calls[0][0].data.codeHash as string;
      expect(savedHash).not.toContain(savedCode);
      expect(savedHash).toHaveLength(64);
    });

    it("1 daqiqa ichida takroriy so'rovni 429 bilan rad etadi (6.3)", async () => {
      // Arrange
      otpFindFirst.mockResolvedValue({ id: 'otp-1', createdAt: new Date() });

      // Act & Assert
      await expect(service.requestOtp('+998901234567')).rejects.toMatchObject({
        code: 'OTP_COOLDOWN',
      });
    });

    it("kutish vaqti o'tgach yangi kod yuborishga ruxsat beradi", async () => {
      otpFindFirst.mockResolvedValue({
        id: 'otp-1',
        createdAt: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS - 1000),
      });

      await expect(service.requestOtp('+998901234567')).resolves.toMatchObject({ sent: true });
    });
  });

  describe('verifyOtp', () => {
    const validRequest = (code: string) => ({
      id: 'otp-1',
      attempts: 0,
      codeHash: (service as unknown as { hashOtp: (p: string, c: string) => string })['hashOtp'](
        '+998901234567',
        code,
      ),
    });

    it("to'g'ri kod bilan tokenlar va foydalanuvchini qaytaradi", async () => {
      // Arrange
      otpFindFirst.mockResolvedValue(validRequest('123456'));

      // Act
      const result = await service.verifyOtp('+998901234567', '123456');

      // Assert
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toHaveLength(96);
      expect(result.user.id).toBe('user-1');
    });

    it('kodni bir marta ishlatilgan deb belgilaydi (atomar)', async () => {
      otpFindFirst.mockResolvedValue(validRequest('123456'));

      await service.verifyOtp('+998901234567', '123456');

      expect(otpUpdateMany).toHaveBeenCalledWith({
        where: { id: 'otp-1', consumedAt: null },
        data: { consumedAt: expect.any(Date) },
      });
    });

    it("urinishni tekshirish va oshirish bitta atomar so'rovda bajariladi", async () => {
      // Arrange
      otpFindFirst.mockResolvedValue(validRequest('123456'));

      // Act
      await expect(service.verifyOtp('+998901234567', '000000')).rejects.toMatchObject({
        code: 'OTP_INVALID',
      });

      // Assert: `attempts < max` sharti WHERE ichida — parallel so'rovlar
      // brute-force chegarasini chetlab o'ta olmaydi
      expect(otpUpdateMany).toHaveBeenCalledWith({
        where: { id: 'otp-1', consumedAt: null, attempts: { lt: 5 } },
        data: { attempts: { increment: 1 } },
      });
    });

    it("urinishlar tugagach yangi kod so'rashni talab qiladi", async () => {
      // Arrange: atomar `updateMany` hech qanday qatorni yangilamadi
      otpFindFirst.mockResolvedValue(validRequest('123456'));
      otpUpdateMany.mockResolvedValue({ count: 0 });

      // Act & Assert
      await expect(service.verifyOtp('+998901234567', '123456')).rejects.toMatchObject({
        code: 'OTP_ATTEMPTS_EXCEEDED',
      });
    });

    it("parallel so'rov kodni oldinroq ishlatib yuborgan bo'lsa sessiya bermaydi", async () => {
      // Arrange: urinish band qilindi, lekin consume bosqichida qator qolmadi
      otpFindFirst.mockResolvedValue(validRequest('123456'));
      otpUpdateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

      // Act & Assert
      await expect(service.verifyOtp('+998901234567', '123456')).rejects.toMatchObject({
        code: 'OTP_INVALID',
      });
    });

    it('bloklangan foydalanuvchini kiritmaydi', async () => {
      otpFindFirst.mockResolvedValue(validRequest('123456'));
      userUpsert.mockResolvedValue({ ...activeUser, status: UserStatus.BLOCKED });

      await expect(service.verifyOtp('+998901234567', '123456')).rejects.toMatchObject({
        code: 'USER_BLOCKED',
      });
    });
  });

  describe('refresh', () => {
    it('qayta ishlatilgan tokenda butun sessiya oilasini bekor qiladi', async () => {
      // Arrange
      refreshFindUnique.mockResolvedValue({
        id: 'refresh-1',
        userId: 'user-1',
        familyId: 'family-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000),
        user: activeUser,
      });

      // Act & Assert
      await expect(service.refresh('stolen-token')).rejects.toMatchObject({
        code: 'REFRESH_REUSED',
      });
      expect(refreshUpdateMany).toHaveBeenCalledWith({
        where: { familyId: 'family-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('muddati tugagan tokenni rad etadi', async () => {
      refreshFindUnique.mockResolvedValue({
        id: 'refresh-1',
        userId: 'user-1',
        familyId: 'family-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: activeUser,
      });

      await expect(service.refresh('old-token')).rejects.toMatchObject({
        code: 'REFRESH_EXPIRED',
      });
    });

    it('yaroqli tokenni almashtiradi (rotation) va eskisini bekor qiladi', async () => {
      // Arrange
      refreshFindUnique.mockResolvedValue({
        id: 'refresh-1',
        userId: 'user-1',
        familyId: 'family-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: activeUser,
      });

      // Act
      const tokens = await service.refresh('valid-token');

      // Assert: bekor qilish atomar `updateMany` orqali "band qilinadi"
      expect(tokens.accessToken).toBe('access-token');
      expect(refreshUpdateMany).toHaveBeenCalledWith({
        where: { id: 'refresh-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(refreshUpdate).toHaveBeenCalledWith({
        where: { id: 'refresh-1' },
        data: { replacedById: 'refresh-1' },
      });
    });

    it("parallel so'rov tokenni oldin band qilgan bo'lsa qayta ishlatish deb hisoblaydi", async () => {
      // Arrange: TOCTOU poygasida yutqazgan so'rov
      refreshFindUnique.mockResolvedValue({
        id: 'refresh-1',
        userId: 'user-1',
        familyId: 'family-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: activeUser,
      });
      refreshUpdateMany.mockResolvedValue({ count: 0 });

      // Act & Assert
      await expect(service.refresh('valid-token')).rejects.toMatchObject({
        code: 'REFRESH_REUSED',
      });
      expect(refreshUpdateMany).toHaveBeenLastCalledWith({
        where: { familyId: 'family-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it("noma'lum tokenni rad etadi", async () => {
      await expect(service.refresh('unknown')).rejects.toMatchObject({
        code: 'REFRESH_INVALID',
      });
    });
  });
});
