import {
  ComplexityLevel,
  PaymentMethod,
  MasterExperienceLevel,
  MasterStatus,
  OrderStatus,
  Prisma,
  ServicePriceKind,
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
  // Eski, qoʻlda kiritilgan usta — ilova hisobiga hali bogʻlanmagan.
  userId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const category: ServiceCategory = {
  id: 'category-1',
  name: "Kran taʼmirlash",
  description: null,
  iconKey: 'tap',
  groupId: null,
  basePrice: 100_000,
  complexityLevel: ComplexityLevel.SIMPLE,
  summary: null,
  details: null,
  includes: [],
  excludes: [],
  durationMinutes: null,
  priceKind: ServicePriceKind.FIXED,
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const buildOrder = (
  status: OrderStatus,
  overrides: Partial<OrderWithRelations> = {},
): OrderWithRelations => ({
  id: 'order-1',
  shortId: 'HZ-104901',
  clientId: 'client-1',
  masterId: 'master-1',
  categoryId: 'category-1',
  description: 'Kran oqmoqda',
  attachmentUrls: [],
  isUrgent: true,
  price: 114_000,
  priceBase: 100_000,
  priceUrgentFee: 20_000,
  discountPercent: 6,
  discountAmount: 6_000,
  paymentMethod: PaymentMethod.ESCROW,
  scheduledAt: null,
  preferredMasterId: null,
  workNote: null,
  handledByMaster: false,
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
  ...overrides,
});

describe('presentOrder', () => {
  it('valyutani har doim UZS qilib qaytaradi (biznes-qoida 5.1)', () => {
    expect(presentOrder(buildOrder(OrderStatus.ASSIGNED)).currency).toBe('UZS');
  });

  it('narxni butun sonda qaytaradi', () => {
    const view = presentOrder(buildOrder(OrderStatus.ASSIGNED));

    expect(Number.isInteger(view.price)).toBe(true);
    expect(view.price).toBe(114_000);
  });

  it('hisob-faktura tafsilotini saqlangan qiymatlardan yigʻadi (qayta hisoblamaydi)', () => {
    const view = presentOrder(buildOrder(OrderStatus.ASSIGNED));

    expect(view.invoice).toEqual({
      base: 100_000,
      urgentFee: 20_000,
      discountPercent: 6,
      discount: 6_000,
      total: 114_000,
    });
    expect(view.invoice.total).toBe(view.price);
  });

  it('qisqa raqam va toʻlov usulini ilova kutgan shaklda qaytaradi', () => {
    const view = presentOrder(buildOrder(OrderStatus.ASSIGNED));

    expect(view.shortId).toBe('HZ-104901');
    expect(view.paymentMethod).toBe('escrow');
  });

  it("toʻlov usuli yoʻq eski buyurtmada taxmin yozmaydi", () => {
    const view = presentOrder(buildOrder(OrderStatus.CLOSED, { paymentMethod: null }));

    expect(view.paymentMethod).toBeNull();
  });

  it('rejalashtirilgan vaqtni mijoz zonasida qaytaradi', () => {
    const view = presentOrder(
      buildOrder(OrderStatus.SEARCHING, { scheduledAt: new Date('2026-09-21T04:00:00.000Z') }),
    );

    expect(view.scheduledAt).toBe('2026-09-21T09:00:00.000+05:00');
  });

  it('kategoriya ikonasi boʻlmasa guruhnikiga tushadi', () => {
    const withoutIcon = presentOrder(
      buildOrder(OrderStatus.ASSIGNED, {
        category: { ...category, iconKey: null, group: { iconKey: 'plumbing' } as never },
      }),
    );

    expect(withoutIcon.category?.iconKey).toBe('plumbing');
  });

  it('ikona kaliti umuman boʻlmasa null qaytaradi (soxta kalit oʻylab topilmaydi)', () => {
    const view = presentOrder(
      buildOrder(OrderStatus.ASSIGNED, { category: { ...category, iconKey: null } }),
    );

    expect(view.category?.iconKey).toBeNull();
  });

  it('ustaning izohi va usta rejimi bayrogʻini qaytaradi', () => {
    const view = presentOrder(
      buildOrder(OrderStatus.COMPLETED_BY_MASTER, {
        workNote: "Kran prokladkasi almashtirildi",
        handledByMaster: true,
      }),
    );

    expect(view.workNote).toBe("Kran prokladkasi almashtirildi");
    expect(view.handledByMaster).toBe(true);
  });

  it("bitta master obyektini qaytaradi, nomzodlar roʻyxatini emas (biznes-qoida 5.2)", () => {
    const view = presentOrder(buildOrder(OrderStatus.ASSIGNED));

    expect(Array.isArray(view.master)).toBe(false);
    expect(view.master?.id).toBe('master-1');
  });

  it.each([
    OrderStatus.ASSIGNED,
    OrderStatus.MASTER_EN_ROUTE,
    OrderStatus.ARRIVED_PENDING_CONFIRMATION,
    OrderStatus.IN_PROGRESS,
  ])("%s holatida usta telefonini koʻrsatadi (6.2)", (status) => {
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

  it("reytingni Decimal dan number ga oʻgiradi", () => {
    expect(presentOrder(buildOrder(OrderStatus.ASSIGNED)).master?.ratingAvg).toBe(4.75);
  });
});
