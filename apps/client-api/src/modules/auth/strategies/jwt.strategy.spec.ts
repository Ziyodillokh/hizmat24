import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const config = { get: () => 'a'.repeat(32) } as never;

  it('faol foydalanuvchini qaytaradi', async () => {
    // Arrange
    const auth = {
      findActiveUser: jest.fn().mockResolvedValue({ id: 'user-1', phoneNumber: '+998901234567' }),
    };
    const strategy = new JwtStrategy(config, auth as never);

    // Act
    const result = await strategy.validate({ sub: 'user-1', phoneNumber: '+998901234567' });

    // Assert
    expect(result).toEqual({ id: 'user-1', phoneNumber: '+998901234567' });
  });

  it("bloklangan yoki o'chirilgan foydalanuvchini har bir so'rovda rad etadi", async () => {
    const auth = { findActiveUser: jest.fn().mockResolvedValue(null) };
    const strategy = new JwtStrategy(config, auth as never);

    await expect(
      strategy.validate({ sub: 'user-1', phoneNumber: '+998901234567' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
