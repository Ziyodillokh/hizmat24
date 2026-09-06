import { URGENT_SCORE_BOOST_MS } from '@shared/index';
import { QueuePositionService } from './queue-position.service';

describe('QueuePositionService.scoreFor', () => {
  it('shoshilinch buyurtmaga kichikroq score beradi (navbat boshiga chiqadi)', () => {
    // Arrange
    const createdAt = new Date('2026-01-01T00:00:00Z');

    // Act
    const urgent = QueuePositionService.scoreFor(createdAt, true);
    const normal = QueuePositionService.scoreFor(createdAt, false);

    // Assert
    expect(urgent).toBeLessThan(normal);
    expect(normal - urgent).toBe(URGENT_SCORE_BOOST_MS);
  });

  it('bir xil ustuvorlikdagi buyurtmalarda FIFO tartibini saqlaydi', () => {
    const earlier = QueuePositionService.scoreFor(new Date('2026-01-01T00:00:00Z'), false);
    const later = QueuePositionService.scoreFor(new Date('2026-01-01T00:05:00Z'), false);

    expect(earlier).toBeLessThan(later);
  });

  it('keyinroq yaratilgan shoshilinch buyurtma oldinroq oddiy buyurtmadan ustun turadi', () => {
    const urgentLater = QueuePositionService.scoreFor(new Date('2026-06-01T00:00:00Z'), true);
    const normalEarlier = QueuePositionService.scoreFor(new Date('2026-01-01T00:00:00Z'), false);

    expect(urgentLater).toBeLessThan(normalEarlier);
  });
});

describe('QueuePositionService.estimateWaitMinutes', () => {
  it("navbatda bo'lmagan buyurtma uchun null qaytaradi", () => {
    expect(QueuePositionService.estimateWaitMinutes(0, 5)).toBeNull();
  });

  it("ustalar soni ko'p bo'lsa kutish vaqti qisqaradi", () => {
    const withFewMasters = QueuePositionService.estimateWaitMinutes(4, 1);
    const withManyMasters = QueuePositionService.estimateWaitMinutes(4, 4);

    expect(withManyMasters!).toBeLessThan(withFewMasters!);
  });

  it("ustalar bo'lmasa ham nolga bo'lish xatosiga tushmaydi", () => {
    expect(QueuePositionService.estimateWaitMinutes(2, 0)).toBe(90);
  });
});

describe('QueuePositionService (Redis Sorted Set)', () => {
  let service: QueuePositionService;
  let redis: {
    zadd: jest.Mock;
    zrem: jest.Mock;
    zrank: jest.Mock;
    zrange: jest.Mock;
    zcard: jest.Mock;
  };

  beforeEach(() => {
    redis = {
      zadd: jest.fn().mockResolvedValue(1),
      zrem: jest.fn().mockResolvedValue(1),
      zrank: jest.fn().mockResolvedValue(2),
      zrange: jest.fn().mockResolvedValue(['order-1', 'order-2']),
      zcard: jest.fn().mockResolvedValue(2),
    };
    service = new QueuePositionService(redis as never);
  });

  it("buyurtmani ustuvorlik score i bilan navbatga qo'shadi", async () => {
    // Arrange
    const createdAt = new Date('2026-01-01T00:00:00Z');

    // Act
    const position = await service.add('order-1', createdAt, true);

    // Assert
    expect(redis.zadd).toHaveBeenCalledWith(
      'orders:queue',
      QueuePositionService.scoreFor(createdAt, true),
      'order-1',
    );
    expect(position).toBe(3);
  });

  it("navbatda bo'lmagan buyurtma uchun 0 qaytaradi", async () => {
    redis.zrank.mockResolvedValue(null);

    expect(await service.positionOf('order-1')).toBe(0);
  });

  it('buyurtmani navbatdan chiqaradi', async () => {
    await service.remove('order-1');

    expect(redis.zrem).toHaveBeenCalledWith('orders:queue', 'order-1');
  });

  it('navbat boshidan berilgan sondagi buyurtmani oladi', async () => {
    await service.peek(5);

    expect(redis.zrange).toHaveBeenCalledWith('orders:queue', 0, 4);
  });

  it("nol so'ralganda ham manfiy indeks yuzaga kelmaydi", async () => {
    await service.peek(0);

    expect(redis.zrange).toHaveBeenCalledWith('orders:queue', 0, 0);
  });

  it('butun navbatni va uzunligini qaytara oladi', async () => {
    expect(await service.all()).toEqual(['order-1', 'order-2']);
    expect(redis.zrange).toHaveBeenCalledWith('orders:queue', 0, -1);
    expect(await service.size()).toBe(2);
  });
});
