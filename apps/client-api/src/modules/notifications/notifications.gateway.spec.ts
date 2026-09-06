import { NotificationsGateway, clientRoom } from './notifications.gateway';

describe('NotificationsGateway (TZ 3.5)', () => {
  let gateway: NotificationsGateway;
  let verifyAsync: jest.Mock;
  let findActiveUser: jest.Mock;
  let join: jest.Mock;
  let disconnect: jest.Mock;
  let emit: jest.Mock;

  const buildSocket = (token?: string) => ({
    id: 'socket-1',
    handshake: { auth: token ? { token } : {}, headers: {} },
    data: {} as Record<string, unknown>,
    join,
    disconnect,
    emit,
  });

  beforeEach(() => {
    verifyAsync = jest.fn().mockResolvedValue({ sub: 'user-1' });
    findActiveUser = jest.fn().mockResolvedValue({ id: 'user-1' });
    join = jest.fn().mockResolvedValue(undefined);
    disconnect = jest.fn();
    emit = jest.fn();

    gateway = new NotificationsGateway(
      { verifyAsync } as never,
      { get: () => 'secret' } as never,
      { findActiveUser } as never,
    );
  });

  it("yaroqli token bilan foydalanuvchi xonasiga qo'shadi", async () => {
    // Arrange
    const socket = buildSocket('valid-token');

    // Act
    await gateway.handleConnection(socket as never);

    // Assert
    expect(join).toHaveBeenCalledWith('client:user-1');
    expect(socket.data.userId).toBe('user-1');
  });

  it('tokensiz ulanishni uzadi', async () => {
    await gateway.handleConnection(buildSocket() as never);

    expect(disconnect).toHaveBeenCalledWith(true);
    expect(join).not.toHaveBeenCalled();
  });

  it('bloklangan foydalanuvchining ulanishini uzadi', async () => {
    findActiveUser.mockResolvedValue(null);

    await gateway.handleConnection(buildSocket('valid-token') as never);

    expect(join).not.toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalledWith(true);
  });

  it('yaroqsiz tokenda ulanishni rad etadi', async () => {
    verifyAsync.mockRejectedValue(new Error('invalid'));

    await gateway.handleConnection(buildSocket('bad-token') as never);

    expect(emit).toHaveBeenCalledWith('error', { code: 'UNAUTHORIZED' });
    expect(disconnect).toHaveBeenCalledWith(true);
  });

  it('Authorization header orqali berilgan tokenni ham qabul qiladi', async () => {
    // Arrange
    const socket = {
      ...buildSocket(),
      handshake: { auth: {}, headers: { authorization: 'Bearer header-token' } },
    };

    // Act
    await gateway.handleConnection(socket as never);

    // Assert
    expect(verifyAsync).toHaveBeenCalledWith('header-token', expect.anything());
  });

  it('xabarni faqat egasining xonasiga yuboradi', () => {
    // Arrange
    const to = jest.fn().mockReturnValue({ emit });
    (gateway as unknown as { server: unknown }).server = { to };

    // Act
    gateway.emitToUser('user-1', 'MASTER_ASSIGNED', { orderId: 'order-1' });

    // Assert
    expect(to).toHaveBeenCalledWith('client:user-1');
    expect(emit).toHaveBeenCalledWith('MASTER_ASSIGNED', { orderId: 'order-1' });
  });

  it("server hali tayyor bo'lmasa xato bermaydi", () => {
    expect(() => gateway.emitToUser('user-1', 'event', {})).not.toThrow();
  });

  it('xona nomi foydalanuvchi id si bilan izolyatsiya qilinadi', () => {
    expect(clientRoom('user-1')).toBe('client:user-1');
    expect(clientRoom('user-2')).not.toBe(clientRoom('user-1'));
  });

  it('uzilishda xato tashlamaydi', () => {
    expect(() => gateway.handleDisconnect(buildSocket() as never)).not.toThrow();
  });
});
