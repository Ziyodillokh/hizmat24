import { MasterBecameAvailableEvent } from '@shared/index';
import { MatchingScheduler } from './matching.scheduler';

describe('MatchingScheduler (TZ 3.4, 7.2)', () => {
  let scheduler: MatchingScheduler;
  let sweepQueue: jest.Mock;
  let reconcile: jest.Mock;

  beforeEach(() => {
    sweepQueue = jest.fn().mockResolvedValue(undefined);
    reconcile = jest.fn().mockResolvedValue([]);
    scheduler = new MatchingScheduler({ sweepQueue } as never, { reconcile } as never);
  });

  it("har tsiklda ustalarning bo'sh/band invariantini tiklaydi", async () => {
    reconcile.mockResolvedValue(['master-1']);

    await scheduler.sweep();

    expect(reconcile).toHaveBeenCalled();
    expect(sweepQueue).toHaveBeenCalled();
  });

  it('davriy ravishda navbatni tekshiradi', async () => {
    await scheduler.sweep();

    expect(sweepQueue).toHaveBeenCalledTimes(1);
  });

  it('oldingi tekshiruv tugamaguncha yangisini boshlamaydi', async () => {
    // Arrange
    let release: () => void = () => undefined;
    sweepQueue.mockImplementation(() => new Promise<void>((resolve) => (release = resolve)));

    // Act
    const first = scheduler.sweep();
    await scheduler.sweep();
    release();
    await first;

    // Assert
    expect(sweepQueue).toHaveBeenCalledTimes(1);
  });

  it('tekshiruvdagi xato keyingi urinishlarni bloklamaydi', async () => {
    // Arrange
    sweepQueue.mockRejectedValueOnce(new Error('redis uzildi'));

    // Act
    await expect(scheduler.sweep()).resolves.toBeUndefined();
    await scheduler.sweep();

    // Assert
    expect(sweepQueue).toHaveBeenCalledTimes(2);
  });

  it("usta bo'shaganda navbatni darhol tekshiradi", async () => {
    await scheduler.onMasterAvailable(new MasterBecameAvailableEvent('master-1'));

    expect(sweepQueue).toHaveBeenCalled();
  });
});
