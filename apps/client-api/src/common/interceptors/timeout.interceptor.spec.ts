import { RequestTimeoutException } from '@nestjs/common';
import { firstValueFrom, of, throwError, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TimeoutInterceptor } from './timeout.interceptor';

describe('TimeoutInterceptor', () => {
  it("vaqtida tugagan so'rovni o'zgartirmaydi", async () => {
    const interceptor = new TimeoutInterceptor(100);
    const next = { handle: () => of('ok') };

    await expect(firstValueFrom(interceptor.intercept({} as never, next as never))).resolves.toBe(
      'ok',
    );
  });

  it('belgilangan vaqtdan oshsa 408 qaytaradi', async () => {
    const interceptor = new TimeoutInterceptor(20);
    const next = { handle: () => timer(200).pipe(switchMap(() => of('kech'))) };

    await expect(
      firstValueFrom(interceptor.intercept({} as never, next as never)),
    ).rejects.toBeInstanceOf(RequestTimeoutException);
  });

  it("boshqa xatolarni o'zgartirmasdan uzatadi", async () => {
    const interceptor = new TimeoutInterceptor(100);
    const original = new Error('domain xatosi');
    const next = { handle: () => throwError(() => original) };

    await expect(firstValueFrom(interceptor.intercept({} as never, next as never))).rejects.toBe(
      original,
    );
  });
});
