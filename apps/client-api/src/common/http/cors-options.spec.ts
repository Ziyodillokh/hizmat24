import { allowedOrigins, buildCorsOptions, CORS_METHODS } from './cors-options';

describe('allowedOrigins', () => {
  it('vergulli roʻyxat va admin manzilini birlashtiradi', () => {
    // Arrange
    const corsOrigins = 'https://hizmat24.uz, https://www.hizmat24.uz';

    // Act
    const result = allowedOrigins(corsOrigins, 'https://admin.hizmat24.uz');

    // Assert
    expect(result).toEqual([
      'https://hizmat24.uz',
      'https://www.hizmat24.uz',
      'https://admin.hizmat24.uz',
    ]);
  });

  it("bo'sh qiymatlar tashlab yuboriladi", () => {
    expect(allowedOrigins(',, ,', '')).toEqual([]);
    expect(allowedOrigins('', 'https://admin.hizmat24.uz')).toEqual(['https://admin.hizmat24.uz']);
  });
});

describe('buildCorsOptions', () => {
  it("ro'yxat bo'sh bo'lsa CORS yoqilmaydi", () => {
    expect(buildCorsOptions('', '')).toBeNull();
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
