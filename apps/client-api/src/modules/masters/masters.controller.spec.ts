import { MastersController } from './masters.controller';

describe('MastersController', () => {
  it("usta profilini faqat so'rovchi mijoz kontekstida oladi", async () => {
    // Arrange
    const findProfileForClient = jest.fn().mockResolvedValue({ id: 'master-1' });
    const controller = new MastersController({ findProfileForClient } as never);

    // Act
    await controller.getProfile('client-1', 'master-1');

    // Assert
    expect(findProfileForClient).toHaveBeenCalledWith('master-1', 'client-1');
  });
});
