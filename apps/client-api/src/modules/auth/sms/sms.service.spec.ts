import { SmsService } from './sms.service';

describe('SmsService', () => {
  const buildService = (config: Record<string, unknown>) =>
    new SmsService({ get: (key: string) => config[key] } as never);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("console provayderida tashqi so'rov yubormaydi", async () => {
    // Arrange
    const fetchSpy = jest.spyOn(global, 'fetch');
    const service = buildService({ SMS_PROVIDER: 'console' });

    // Act
    await service.sendOtp('+998901234567', '123456');

    // Assert
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('HTTP provayderiga raqamni + belgisiz va matn bilan yuboradi', async () => {
    // Arrange
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, status: 200 } as Response);
    const service = buildService({
      SMS_PROVIDER: 'eskiz',
      SMS_API_URL: 'https://sms.example/send',
      SMS_API_TOKEN: 'token',
      SMS_SENDER: '4546',
    });

    // Act
    await service.sendOtp('+998901234567', '123456');

    // Assert
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toMatchObject({ mobile_phone: '998901234567', from: '4546' });
    expect(body.message).toContain('123456');
  });

  it("provayder sozlanmagan bo'lsa aniq xato beradi", async () => {
    const service = buildService({ SMS_PROVIDER: 'eskiz' });

    await expect(service.sendOtp('+998901234567', '123456')).rejects.toThrow('sozlanmagan');
  });

  it('provayder xato qaytarsa xato tashlaydi', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 502 } as Response);
    const service = buildService({
      SMS_PROVIDER: 'eskiz',
      SMS_API_URL: 'https://sms.example/send',
      SMS_API_TOKEN: 'token',
    });

    await expect(service.sendOtp('+998901234567', '123456')).rejects.toThrow('502');
  });
});
