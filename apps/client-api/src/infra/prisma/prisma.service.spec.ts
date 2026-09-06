import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('modul ishga tushganda DB ga ulanadi', async () => {
    // Arrange
    const service = new PrismaService();
    const connect = jest.spyOn(service, '$connect').mockResolvedValue(undefined);

    // Act
    await service.onModuleInit();

    // Assert
    expect(connect).toHaveBeenCalled();
  });

  it("modul to'xtaganda ulanishni yopadi (graceful shutdown)", async () => {
    const service = new PrismaService();
    const disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalled();
  });
});
