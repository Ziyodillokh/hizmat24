import type { FastifyRequest } from 'fastify';
import { requestContextOf } from './request-context';

const requestOf = (overrides: Record<string, unknown>): FastifyRequest =>
  ({ headers: {}, ...overrides }) as unknown as FastifyRequest;

describe('requestContextOf', () => {
  it('IP va brauzer nomini oladi', () => {
    const request = requestOf({ ip: '10.0.0.5', headers: { 'user-agent': 'Hizmat24/1.0' } });

    expect(requestContextOf(request)).toEqual({ ipAddress: '10.0.0.5', userAgent: 'Hizmat24/1.0' });
  });

  it('maʼlumot boʻlmasa `null` yoziladi — audit yozuvi baribir qoʻyilishi kerak', () => {
    expect(requestContextOf(requestOf({}))).toEqual({ ipAddress: null, userAgent: null });
  });
});
