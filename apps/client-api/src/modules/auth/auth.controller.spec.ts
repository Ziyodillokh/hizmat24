import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let auth: {
    requestOtp: jest.Mock;
    verifyOtp: jest.Mock;
    refresh: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(() => {
    auth = {
      requestOtp: jest.fn().mockResolvedValue({ sent: true, retryAfterSeconds: 60 }),
      verifyOtp: jest.fn().mockResolvedValue({ accessToken: 'a' }),
      refresh: jest.fn().mockResolvedValue({ accessToken: 'b' }),
      logout: jest.fn().mockResolvedValue(undefined),
    };
    controller = new AuthController(auth as never);
  });

  it("OTP so'rovini servisga uzatadi", async () => {
    await controller.requestOtp({ phoneNumber: '+998901234567' });

    expect(auth.requestOtp).toHaveBeenCalledWith('+998901234567');
  });

  it('OTP tekshirishni servisga uzatadi', async () => {
    await controller.verifyOtp({ phoneNumber: '+998901234567', otpCode: '123456' });

    expect(auth.verifyOtp).toHaveBeenCalledWith('+998901234567', '123456');
  });

  it('token yangilashni servisga uzatadi', async () => {
    await controller.refresh({ refreshToken: 'token' });

    expect(auth.refresh).toHaveBeenCalledWith('token');
  });

  it('chiqishda foydalanuvchi id si va tokenni birga uzatadi', async () => {
    await controller.logout('user-1', { refreshToken: 'token' });

    expect(auth.logout).toHaveBeenCalledWith('user-1', 'token');
  });
});
