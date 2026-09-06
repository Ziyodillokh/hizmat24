import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let check: jest.Mock;
  let indicatorUp: jest.Mock;
  let indicatorDown: jest.Mock;
  let queryRaw: jest.Mock;
  let ping: jest.Mock;

  beforeEach(() => {
    check = jest.fn().mockImplementation(async (checks: (() => Promise<unknown>)[]) => {
      const results = await Promise.all(checks.map((fn) => fn()));
      return { status: 'ok', details: results };
    });
    indicatorUp = jest.fn().mockReturnValue({ status: 'up' });
    indicatorDown = jest.fn().mockReturnValue({ status: 'down' });
    queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    ping = jest.fn().mockResolvedValue('PONG');

    controller = new HealthController(
      { check } as never,
      { check: () => ({ up: indicatorUp, down: indicatorDown }) } as never,
      { $queryRaw: queryRaw } as never,
      { get: () => 'metrics-secret-token' } as never,
      { ping } as never,
    );
  });

  it('liveness har doim ok qaytaradi', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('readiness DB va Redis ni tekshiradi', async () => {
    await controller.ready();

    expect(queryRaw).toHaveBeenCalled();
    expect(ping).toHaveBeenCalled();
    expect(indicatorUp).toHaveBeenCalledTimes(2);
  });

  it('DB javob bermasa "down" deb belgilaydi', async () => {
    queryRaw.mockRejectedValue(new Error('connection refused'));

    await controller.ready();

    expect(indicatorDown).toHaveBeenCalledWith({ message: 'unavailable' });
  });

  it('Redis javob bermasa "down" deb belgilaydi', async () => {
    ping.mockRejectedValue(new Error('redis down'));

    await controller.ready();

    expect(indicatorDown).toHaveBeenCalledWith({ message: 'unavailable' });
  });

  it("to'g'ri token bilan Prometheus metrikalarini qaytaradi", async () => {
    const metrics = await controller.metrics('metrics-secret-token');

    expect(typeof metrics).toBe('string');
    expect(metrics).toContain('hizmat24_client_api_');
  });

  it("tokensiz metrikalarni bermaydi (ichki holat oshkor bo'lmasin)", () => {
    expect(() => controller.metrics()).toThrow('ruxsat');
  });

  it("noto'g'ri token bilan metrikalarni bermaydi", () => {
    expect(() => controller.metrics('boshqa-token-uzunroq')).toThrow('ruxsat');
  });
});
