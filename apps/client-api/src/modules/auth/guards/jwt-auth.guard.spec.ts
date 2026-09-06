import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const buildContext = () => ({ getHandler: () => undefined, getClass: () => undefined }) as never;

  it("@Public() belgilangan endpointni o'tkazadi", () => {
    // Arrange
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(true) };
    const guard = new JwtAuthGuard(reflector as never);

    // Act & Assert
    expect(guard.canActivate(buildContext())).toBe(true);
  });

  it('boshqa barcha endpointlarda JWT tekshiruvini talab qiladi', () => {
    // Arrange
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const guard = new JwtAuthGuard(reflector as never);
    const superSpy = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(false);

    // Act
    const result = guard.canActivate(buildContext());

    // Assert
    expect(superSpy).toHaveBeenCalled();
    expect(result).toBe(false);
    superSpy.mockRestore();
  });
});
