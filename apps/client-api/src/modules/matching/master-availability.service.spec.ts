import { MasterStatus, OrderStatus } from '@prisma/client';
import { MasterAvailabilityService } from './master-availability.service';

describe('MasterAvailabilityService', () => {
  let service: MasterAvailabilityService;
  let findMany: jest.Mock;
  let updateMany: jest.Mock;

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue([]);
    updateMany = jest.fn().mockResolvedValue({ count: 0 });
    service = new MasterAvailabilityService({ master: { findMany, updateMany } } as never);
  });

  it("aktiv buyurtmasiz band ustalarni bo'shatadi", async () => {
    // Arrange
    findMany.mockResolvedValue([{ id: 'master-1' }, { id: 'master-2' }]);

    // Act
    const freed = await service.reconcile();

    // Assert
    expect(freed).toEqual(['master-1', 'master-2']);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['master-1', 'master-2'] }, status: MasterStatus.BUSY },
      data: { status: MasterStatus.AVAILABLE },
    });
  });

  it("faqat aktiv buyurtmasi yo'q ustalarni qidiradi", async () => {
    await service.reconcile();

    expect(findMany).toHaveBeenCalledWith({
      where: {
        status: MasterStatus.BUSY,
        orders: {
          none: {
            status: {
              in: [
                OrderStatus.ASSIGNED,
                OrderStatus.MASTER_EN_ROUTE,
                OrderStatus.ARRIVED_PENDING_CONFIRMATION,
                OrderStatus.IN_PROGRESS,
              ],
            },
          },
        },
      },
      select: { id: true },
    });
  });

  it("tuzatiladigan narsa bo'lmasa yozuv qilmaydi", async () => {
    const freed = await service.reconcile();

    expect(freed).toEqual([]);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
