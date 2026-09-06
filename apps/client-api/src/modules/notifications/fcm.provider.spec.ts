const sendEachForMulticast = jest.fn();
const initializeApp = jest.fn().mockReturnValue({ name: 'app' });
const cert = jest.fn().mockReturnValue({});

jest.mock('firebase-admin', () => ({
  initializeApp: (...args: unknown[]) => initializeApp(...args),
  credential: { cert: (...args: unknown[]) => cert(...args) },
  messaging: () => ({ sendEachForMulticast }),
}));

import { FcmProvider } from './fcm.provider';

const enabledConfig = (overrides: Record<string, unknown> = {}) => ({
  get: (key: string) =>
    ({
      FCM_ENABLED: true,
      FCM_PROJECT_ID: 'project',
      FCM_CLIENT_EMAIL: 'sa@project.iam.gserviceaccount.com',
      FCM_PRIVATE_KEY: 'line1\\nline2',
      ...overrides,
    })[key],
});

describe('FcmProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("FCM o'chirilgan bo'lsa ishga tushmaydi va push yubormaydi", async () => {
    const provider = new FcmProvider({ get: () => false } as never);

    provider.onModuleInit();

    expect(initializeApp).not.toHaveBeenCalled();
    await expect(
      provider.sendToTokens(['token-1'], { title: 't', body: 'b', data: {} }),
    ).resolves.toEqual([]);
  });

  it("token ro'yxati bo'sh bo'lsa so'rov yubormaydi", async () => {
    const provider = new FcmProvider(enabledConfig() as never);
    provider.onModuleInit();

    await expect(provider.sendToTokens([], { title: 't', body: 'b', data: {} })).resolves.toEqual(
      [],
    );
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('private key dagi \\n belgilarini haqiqiy qator uzilishiga aylantiradi', () => {
    const provider = new FcmProvider(enabledConfig() as never);

    provider.onModuleInit();

    expect(cert).toHaveBeenCalledWith(expect.objectContaining({ privateKey: 'line1\nline2' }));
  });

  it('push ni yuqori ustuvorlik bilan yuboradi', async () => {
    // Arrange
    sendEachForMulticast.mockResolvedValue({ responses: [{ success: true }] });
    const provider = new FcmProvider(enabledConfig() as never);
    provider.onModuleInit();

    // Act
    await provider.sendToTokens(['token-1'], { title: 'Usta topildi', body: 'b', data: {} });

    // Assert
    expect(sendEachForMulticast).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ['token-1'],
        android: { priority: 'high' },
      }),
    );
  });

  it('yaroqsiz tokenlarni qaytaradi', async () => {
    // Arrange
    sendEachForMulticast.mockResolvedValue({
      responses: [{ success: true }, { success: false }],
    });
    const provider = new FcmProvider(enabledConfig() as never);
    provider.onModuleInit();

    // Act
    const invalid = await provider.sendToTokens(['good', 'bad'], {
      title: 't',
      body: 'b',
      data: {},
    });

    // Assert
    expect(invalid).toEqual(['bad']);
  });

  it("FCM xatosi bildirishnoma oqimini to'xtatmaydi", async () => {
    sendEachForMulticast.mockRejectedValue(new Error('FCM down'));
    const provider = new FcmProvider(enabledConfig() as never);
    provider.onModuleInit();

    await expect(
      provider.sendToTokens(['token-1'], { title: 't', body: 'b', data: {} }),
    ).resolves.toEqual([]);
  });
});
