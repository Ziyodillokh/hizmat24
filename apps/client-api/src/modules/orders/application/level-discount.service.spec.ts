import { OrderStatus } from '@prisma/client';
import { LevelDiscountService } from './level-discount.service';

describe('LevelDiscountService', () => {
  let count: jest.Mock;
  let service: LevelDiscountService;

  beforeEach(() => {
    count = jest.fn();
    service = new LevelDiscountService({ order: { count } } as never);
  });

  it('faqat yakunlangan buyurtmalarni sanaydi (bekor qilingan daraja bermaydi)', async () => {
    // Arrange
    count.mockResolvedValue(0);

    // Act
    await service.percentForClient('client-1');

    // Assert
    expect(count).toHaveBeenCalledWith({
      where: {
        clientId: 'client-1',
        status: { in: [OrderStatus.RATED, OrderStatus.CLOSED] },
      },
    });
  });

  it.each([
    [9, 2],
    [10, 4],
    [29, 4],
    [30, 6],
  ])('%i ta yakunlangan buyurtma → %i%% chegirma', async (closed, percent) => {
    count.mockResolvedValue(closed);

    await expect(service.percentForClient('client-1')).resolves.toBe(percent);
  });
});
