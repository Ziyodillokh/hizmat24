import { allowedOrigins, buildCorsOptions, CORS_METHODS, WEBVIEW_ORIGINS } from './cors-options';

describe('allowedOrigins', () => {
  it('vergulli roʻyxat va admin manzilini birlashtiradi', () => {
    // Arrange
    const corsOrigins = 'https://hizmat24.uz, https://www.hizmat24.uz';

    // Act
    const result = allowedOrigins(corsOrigins, 'https://admin.hizmat24.uz');

    // Assert
    expect(result).toEqual([
      'https://localhost',
      'https://hizmat24.uz',
      'https://www.hizmat24.uz',
      'https://admin.hizmat24.uz',
    ]);
  });

  it("bo'sh qiymatlar tashlab yuboriladi", () => {
    expect(allowedOrigins(',, ,', '')).toEqual([...WEBVIEW_ORIGINS]);
    expect(allowedOrigins('', 'https://admin.hizmat24.uz')).toEqual([
      'https://localhost',
      'https://admin.hizmat24.uz',
    ]);
  });

  /*
   * Android ilovasi WebView'dan `https://localhost` bilan keladi. Bu
   * manzil roʻyxatdan tushib qolsa ilova serverga UMUMAN ulana olmaydi —
   * production'da aynan shunday boʻlgan edi.
   */
  it('ilovaning WebView manzili har doim roʻyxatda boʻladi', () => {
    expect(allowedOrigins('', '')).toContain('https://localhost');
    expect(allowedOrigins('https://hizmat24.uz', 'https://admin.hizmat24.uz')).toContain(
      'https://localhost',
    );
  });

  it('bir manzil ikki marta yozilsa takrorlanmaydi', () => {
    const result = allowedOrigins('https://localhost, https://hizmat24.uz', 'https://hizmat24.uz');

    expect(result).toEqual(['https://localhost', 'https://hizmat24.uz']);
  });
});

describe('buildCorsOptions', () => {
  it('sozlama boʻsh boʻlsa ham ilova uchun CORS yoqiladi', () => {
    const options = buildCorsOptions('', '');

    expect(options).not.toBeNull();
    expect(options?.origin).toEqual([...WEBVIEW_ORIGINS]);
  });

  /*
   * `@fastify/cors` sukut bo'yicha PATCH/DELETE bermaydi. Panel
   * foydalanuvchini bloklashda PATCH, signalni hal qilishda DELETE
   * yuboradi — roʻyxat qisqarsa brauzer ularni to'sib qo'yadi.
   */
  it('PATCH va DELETE ruxsat etilgan metodlar ichida boʻladi', () => {
    const options = buildCorsOptions('', 'https://admin.hizmat24.uz');

    expect(options?.methods).toEqual(expect.arrayContaining(['PATCH', 'DELETE']));
    expect(CORS_METHODS).toContain('PATCH');
    expect(CORS_METHODS).toContain('DELETE');
  });

  it("Origin sifatida `*` hech qachon qaytarilmaydi", () => {
    const options = buildCorsOptions('https://hizmat24.uz', 'https://admin.hizmat24.uz');

    expect(options?.credentials).toBe(true);
    expect(options?.origin).not.toContain('*');
  });
});
