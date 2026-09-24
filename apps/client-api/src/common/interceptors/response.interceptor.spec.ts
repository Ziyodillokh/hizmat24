import { firstValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

/** `getAllAndOverride` nima qaytarishini boshqaradigan soxta reflector. */
const reflector = (isRaw = false) =>
  ({ getAllAndOverride: () => isRaw }) as never;

const context = { getHandler: () => undefined, getClass: () => undefined } as never;

describe('ResponseInterceptor (umumiy talab 1.2)', () => {
  it("javobni { success, data, error } konvertiga oʻraydi", async () => {
    // Arrange
    const interceptor = new ResponseInterceptor<{ id: string }>(reflector());
    const next = { handle: () => of({ id: 'order-1' }) };

    // Act
    const result = await firstValueFrom(interceptor.intercept(context, next as never));

    // Assert
    expect(result).toEqual({ success: true, data: { id: 'order-1' }, error: null });
  });

  it('null javobni ham konvertda qaytaradi', async () => {
    const interceptor = new ResponseInterceptor(reflector());
    const next = { handle: () => of(null) };

    await expect(firstValueFrom(interceptor.intercept(context, next as never))).resolves.toEqual({
      success: true,
      data: null,
      error: null,
    });
  });

  /*
   * Fayl (CSV) konvert ichiga tushib qolsa, brauzer uni ocha olmaydi:
   * Fastify obyektni javob tanasi sifatida yubora olmaydi.
   */
  it('`@RawResponse()` belgilangan javob oʻralmaydi', async () => {
    const interceptor = new ResponseInterceptor<string>(reflector(true));
    const next = { handle: () => of('"vaqt","amal"\n"2026-09-24","PII_VIEWED"') };

    const result = await firstValueFrom(interceptor.intercept(context, next as never));

    expect(typeof result).toBe('string');
    expect(result).toContain('"vaqt"');
  });
});
