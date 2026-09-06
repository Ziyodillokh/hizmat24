import {
  ComplexityLevel,
  MasterExperienceLevel,
  MasterStatus,
  OrderStatus,
  Prisma,
  type Master,
  type ServiceCategory,
} from '@prisma/client';
import { presentOrder, type OrderWithRelations } from './order.presenter';

const master: Master = {
  id: 'master-1',
  fullName: 'Akmal Rahimov',
  phoneNumber: '+998901112233',
  photoUrl: null,
  experienceLevel: MasterExperienceLevel.EXPERIENCED,
  hasGovCertificate: true,
  ratingAvg: new Prisma.Decimal('4.75'),
  ratingCount: 12,
  completedOrdersCount: 30,
  status: MasterStatus.BUSY,
  isActive: true,
  lastLat: 41.31,
  lastLng: 69.24,
  lastLocationAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const category: ServiceCategory = {
  id: 'category-1',
  name: "Kran ta'mirlash",
  description: null,
  groupId: null,
  basePrice: 100_000,
  complexityLevel: ComplexityLevel.SIMPLE,
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const buildOrder = (status: OrderStatus): OrderWithRelations => ({
  id: 'order-1',
  clientId: 'client-1',
  masterId: 'master-1',
  categoryId: 'category-1',
  description: 'Kran oqmoqda',
  attachmentUrls: [],
  isUrgent: false,
  price: 100_000,
  status,
  queuePosition: null,
  etaMinutes: 12,
  clientAddress: { label: 'Chilonzor', lat: 41.3, lng: 69.2 },
  addressLat: 41.3,
  addressLng: 69.2,
  cancelReason: null,
  cancelledBy: null,
  cancelledAt: null,
  assignmentAttempts: 1,
  assignedAt: new Date(),
  masterAckedAt: null,
  enRouteAt: null,
  arrivedAt: null,
  startedAt: null,
  completedAt: null,
  closedAt: null,
  idempotencyKey: null,
  createdAt: new Date('2026-09-05T12:00:00.000Z'),
  updatedAt: new Date('2026-09-05T12:00:00.000Z'),
  master,
  category,
  rating: null,
});

describe('presentOrder', () => {
  it('valyutani har doim UZS qilib qaytaradi (biznes-qoida 5.1)', () => {
    expect(presentOrder(buildOrder(OrderStatus.ASSIGNED)).currency).toBe('UZS');
  });

  it('narxni butun sonda qaytaradi', () => {
    const view = presentOrder(buildOrder(OrderStatus.ASSIGNED));

    expect(Number.isInteger(view.price)).toBe(true);
    expect(view.price).toBe(100_000);
  });

  it("bitta master obyektini qaytaradi, nomzodlar ro'yxatini emas (biznes-qoida 5.2)", () => {
    const view = presentOrder(buildOrder(OrderStatus.ASSIGNED));

    expect(Array.isArray(view.master)).toBe(false);
    expect(view.master?.id).toBe('master-1');
  });

  it.each([
    OrderStatus.ASSIGNED,
    OrderStatus.MASTER_EN_ROUTE,
    OrderStatus.ARRIVED_PENDING_CONFIRMATION,
    OrderStatus.IN_PROGRESS,
  ])("%s holatida usta telefonini ko'rsatadi (6.2)", (status) => {
    expect(presentOrder(buildOrder(status)).master?.phoneNumber).toBe('+998901112233');
  });

  it.each([
    OrderStatus.SEARCHING,
    OrderStatus.COMPLETED_BY_MASTER,
    OrderStatus.RATED,
    OrderStatus.CLOSED,
    OrderStatus.CANCELLED,
    OrderStatus.SAFETY_FLAGGED,
  ])('%s holatida usta telefonini yashiradi (6.2)', (status) => {
    expect(presentOrder(buildOrder(status)).master?.phoneNumber).toBeNull();
  });

  it('vaqtlarni Asia/Tashkent zonasida qaytaradi', () => {
    expect(presentOrder(buildOrder(OrderStatus.ASSIGNED)).createdAt).toBe(
      '2026-09-05T17:00:00.000+05:00',
    );
  });

  it("reytingni Decimal dan number ga o'giradi", () => {
    expect(presentOrder(buildOrder(OrderStatus.ASSIGNED)).master?.ratingAvg).toBe(4.75);
  });
});
