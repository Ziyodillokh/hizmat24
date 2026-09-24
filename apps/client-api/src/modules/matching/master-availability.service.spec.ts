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

  const onShift = (id: string) => ({ id, profile: { availableSince: new Date() } });
  const offShift = (id: string) => ({ id, profile: { availableSince: null } });

  it("smenasi ochiq ustalarni boʻshatadi", async () => {
    // Arrange
    findMany.mockResolvedValue([onShift('master-1'), onShift('master-2')]);

    // Act
    const freed = await service.reconcile();

    // Assert
    expect(freed).toEqual(['master-1', 'master-2']);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['master-1', 'master-2'] }, status: MasterStatus.BUSY },
      data: { status: MasterStatus.AVAILABLE },
    });
  });

  /*
   * Smenasini yopib qoʻygan usta ish tugagach yana `AVAILABLE` boʻlib
   * qolsa, u soʻramagan taklif kelardi — telefoni jiringlab, oʻzi esa
   * ishlamayotgan boʻlardi.
   */
  it("smenasi yopiq usta OFFLINE boʻladi va navbatga qaytarilmaydi", async () => {
    findMany.mockResolvedValue([offShift('master-3')]);

    const freed = await service.reconcile();

    expect(freed).toEqual([]);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['master-3'] }, status: MasterStatus.BUSY },
      data: { status: MasterStatus.OFFLINE },
    });
  });

  it("aralash holatda har biri oʻz holatini oladi", async () => {
    findMany.mockResolvedValue([onShift('master-1'), offShift('master-3')]);

    const freed = await service.reconcile();

    expect(freed).toEqual(['master-1']);
    expect(updateMany).toHaveBeenCalledTimes(2);
  });

  it("faqat aktiv buyurtmasi yoʻq ustalarni qidiradi", async () => {
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
      select: { id: true, profile: { select: { availableSince: true } } },
    });
  });

  it("tuzatiladigan narsa boʻlmasa yozuv qilmaydi", async () => {
    const freed = await service.reconcile();

    expect(freed).toEqual([]);
    expect(updateMany).not.toHaveBeenCalled();
  });
});
