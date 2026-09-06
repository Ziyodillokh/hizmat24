import { firstValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor (umumiy talab 1.2)', () => {
  it("javobni { success, data, error } konvertiga o'raydi", async () => {
    // Arrange
    const interceptor = new ResponseInterceptor<{ id: string }>();
    const next = { handle: () => of({ id: 'order-1' }) };

    // Act
    const result = await firstValueFrom(interceptor.intercept({} as never, next as never));

    // Assert
    expect(result).toEqual({ success: true, data: { id: 'order-1' }, error: null });
  });

  it('null javobni ham konvertda qaytaradi', async () => {
    const interceptor = new ResponseInterceptor();
    const next = { handle: () => of(null) };

    await expect(
      firstValueFrom(interceptor.intercept({} as never, next as never)),
    ).resolves.toEqual({ success: true, data: null, error: null });
  });
});
