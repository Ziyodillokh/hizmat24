import { toClientZone } from './datetime.util';

describe('toClientZone', () => {
  it('UTC vaqtni Asia/Tashkent (+05:00) zonasida qaytaradi', () => {
    // Arrange
    const utc = new Date('2026-09-05T12:00:00.000Z');

    // Act
    const result = toClientZone(utc);

    // Assert
    expect(result).toBe('2026-09-05T17:00:00.000+05:00');
  });

  it('null uchun null qaytaradi', () => {
    expect(toClientZone(null)).toBeNull();
    expect(toClientZone(undefined)).toBeNull();
  });
});
