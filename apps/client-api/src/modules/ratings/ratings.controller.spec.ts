import { RatingsController } from './ratings.controller';

describe('RatingsController', () => {
  it('baholashni servisga uzatadi', async () => {
    // Arrange
    const rateOrder = jest.fn().mockResolvedValue({ id: 'rating-1' });
    const controller = new RatingsController({ rateOrder } as never);

    // Act
    await controller.rate('client-1', 'order-1', { stars: 5, comment: 'rahmat' });

    // Assert
    expect(rateOrder).toHaveBeenCalledWith('order-1', 'client-1', 5, 'rahmat');
  });

  it('izohsiz baholashda null uzatadi', async () => {
    const rateOrder = jest.fn().mockResolvedValue({ id: 'rating-1' });
    const controller = new RatingsController({ rateOrder } as never);

    await controller.rate('client-1', 'order-1', { stars: 4 });

    expect(rateOrder).toHaveBeenCalledWith('order-1', 'client-1', 4, null);
  });
});
