import type { ExecutionContext } from '@nestjs/common';
import { CurrentUser, extractCurrentUser } from './current-user.decorator';

describe('extractCurrentUser', () => {
  const buildContext = (user?: unknown) =>
    ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as ExecutionContext;

  it("maydon ko'rsatilmasa butun foydalanuvchi obyektini qaytaradi", () => {
    const user = { id: 'user-1', phoneNumber: '+998901234567' };

    expect(extractCurrentUser(undefined, buildContext(user))).toEqual(user);
  });

  it("so'ralgan maydonni qaytaradi", () => {
    expect(
      extractCurrentUser('id', buildContext({ id: 'user-1', phoneNumber: '+998901234567' })),
    ).toBe('user-1');
  });

  it("guard foydalanuvchini joylashtirmagan bo'lsa undefined qaytaradi", () => {
    expect(extractCurrentUser('id', buildContext(undefined))).toBeUndefined();
  });

  it('dekorator sifatida eksport qilingan', () => {
    expect(typeof CurrentUser).toBe('function');
  });
});
