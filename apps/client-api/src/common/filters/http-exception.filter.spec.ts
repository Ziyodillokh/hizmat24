import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainException } from '@client/common/exceptions/domain.exception';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter (umumiy talab 1.2)', () => {
  let filter: HttpExceptionFilter;
  let send: jest.Mock;
  let type: jest.Mock;
  let status: jest.Mock;
  let host: { switchToHttp: () => { getResponse: () => unknown } };

  beforeEach(() => {
    send = jest.fn();
    type = jest.fn().mockReturnValue({ send });
    status = jest.fn().mockReturnValue({ type });
    host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) };
    filter = new HttpExceptionFilter();
  });

  it('javobni har doim JSON turi bilan yuboradi', () => {
    // `@Header('content-type', 'text/plain')` bilan belgilangan marshrutda
    // (masalan /metrics) xato yuz berganda Fastify obyektni yubora olmasdi.
    filter.catch(new NotFoundException('topilmadi'), host as never);

    expect(type).toHaveBeenCalledWith('application/json; charset=utf-8');
  });

  it("domain xatosini kod va xabar bilan konvertga o'raydi", () => {
    // Act
    filter.catch(
      new DomainException('CANCEL_NOT_ALLOWED', "Bekor qilib bo'lmaydi", HttpStatus.FORBIDDEN),
      host as never,
    );

    // Assert
    expect(status).toHaveBeenCalledWith(403);
    expect(send).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: { code: 'CANCEL_NOT_ALLOWED', message: "Bekor qilib bo'lmaydi", details: undefined },
    });
  });

  it("validatsiya xatolarining ro'yxatini bitta xabarga birlashtiradi", () => {
    filter.catch(
      new NotFoundException({ message: ['maydon-1 xato', 'maydon-2 xato'] }),
      host as never,
    );

    expect(send.mock.calls[0][0].error.message).toBe('maydon-1 xato; maydon-2 xato');
  });

  it("Prisma unique constraint xatosini 409 ga o'giradi", () => {
    filter.catch(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6.0.0',
      }),
      host as never,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(send.mock.calls[0][0].error.code).toBe('DUPLICATE_RESOURCE');
  });

  it('Prisma "topilmadi" xatosini 404 ga o\'giradi', () => {
    filter.catch(
      new Prisma.PrismaClientKnownRequestError('missing', {
        code: 'P2025',
        clientVersion: '6.0.0',
      }),
      host as never,
    );

    expect(status).toHaveBeenCalledWith(404);
  });

  it('kutilmagan xatoda ichki tafsilotlarni oshkor qilmaydi', () => {
    filter.catch(new Error("DB parolini topib bo'lmadi: secret123"), host as never);

    expect(status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(send.mock.calls[0][0])).not.toContain('secret123');
  });
});
