import { OrderStatus } from '@prisma/client';
import {
  DomainException,
  ForbiddenResourceException,
  InvalidStateTransitionException,
} from '@client/common/exceptions/domain.exception';
import { OrderEntity, type OrderProps } from './order.entity';

const buildOrder = (overrides: Partial<OrderProps> = {}): OrderEntity =>
  OrderEntity.fromPersistence({
    id: 'order-1',
    clientId: 'client-1',
    masterId: null,
    categoryId: 'category-1',
    status: OrderStatus.SEARCHING,
    isUrgent: false,
    price: 100_000,
    queuePosition: null,
    assignmentAttempts: 0,
    masterAckedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

describe('OrderEntity', () => {
  describe('assertOwnedBy', () => {
    it("egasi bo'lmagan foydalanuvchini rad etadi", () => {
      const order = buildOrder();

      expect(() => order.assertOwnedBy('boshqa-client')).toThrow(ForbiddenResourceException);
    });

    it('egasiga ruxsat beradi', () => {
      const order = buildOrder();

      expect(() => order.assertOwnedBy('client-1')).not.toThrow();
    });
  });

  describe('transitionTo', () => {
    it("yangi obyekt qaytaradi, asl obyektni o'zgartirmaydi (immutability)", () => {
      // Arrange
      const order = buildOrder();

      // Act
      const next = order.transitionTo(OrderStatus.SEARCHING_QUEUED);

      // Assert
      expect(next).not.toBe(order);
      expect(order.status).toBe(OrderStatus.SEARCHING);
      expect(next.status).toBe(OrderStatus.SEARCHING_QUEUED);
    });

    it("ruxsat etilmagan o'tishda xato tashlaydi", () => {
      const order = buildOrder({ status: OrderStatus.IN_PROGRESS });

      expect(() => order.transitionTo(OrderStatus.CLOSED)).toThrow(InvalidStateTransitionException);
    });
  });

  describe('cancelByClient', () => {
    it.each([
      OrderStatus.SEARCHING,
      OrderStatus.SEARCHING_QUEUED,
      OrderStatus.ASSIGNED,
      OrderStatus.MASTER_EN_ROUTE,
    ])('%s holatida bekor qilishga ruxsat beradi', (status) => {
      const order = buildOrder({ status });

      expect(order.cancelByClient().status).toBe(OrderStatus.CANCELLED);
    });

    it('ish boshlangandan keyin 403 bilan rad etadi (biznes-qoida 5.5)', () => {
      // Arrange
      const order = buildOrder({ status: OrderStatus.IN_PROGRESS });

      // Act & Assert
      try {
        order.cancelByClient();
        fail('xato tashlanishi kerak edi');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainException);
        expect((error as DomainException).getStatus()).toBe(403);
        expect((error as DomainException).code).toBe('CANCEL_NOT_ALLOWED');
      }
    });

    it("yakunlangan buyurtmani bekor qilishga yo'l qo'ymaydi", () => {
      const order = buildOrder({ status: OrderStatus.COMPLETED_BY_MASTER });

      expect(() => order.cancelByClient()).toThrow(DomainException);
    });
  });

  describe('confirmMaster / flagSafety (TZ 3.7)', () => {
    it('tasdiqlanganda ish boshlanadi', () => {
      const order = buildOrder({ status: OrderStatus.ARRIVED_PENDING_CONFIRMATION });

      expect(order.confirmMaster().status).toBe(OrderStatus.IN_PROGRESS);
    });

    it("tasdiqlanmaganda safety_flagged ga o'tadi va u terminal bo'ladi", () => {
      // Arrange
      const order = buildOrder({ status: OrderStatus.ARRIVED_PENDING_CONFIRMATION });

      // Act
      const flagged = order.flagSafety();

      // Assert
      expect(flagged.status).toBe(OrderStatus.SAFETY_FLAGGED);
      expect(flagged.isTerminal).toBe(true);
      expect(() => flagged.transitionTo(OrderStatus.IN_PROGRESS)).toThrow(
        InvalidStateTransitionException,
      );
    });
  });

  describe('assignTo', () => {
    it('ustani biriktiradi, urinishlar sonini oshiradi va navbatdan chiqaradi', () => {
      // Arrange
      const order = buildOrder({ status: OrderStatus.SEARCHING_QUEUED, queuePosition: 3 });

      // Act
      const assigned = order.assignTo('master-1');

      // Assert
      expect(assigned.status).toBe(OrderStatus.ASSIGNED);
      expect(assigned.masterId).toBe('master-1');
      expect(assigned.assignmentAttempts).toBe(1);
      expect(assigned.toSnapshot().queuePosition).toBeNull();
    });
  });

  describe('releaseForReassignment', () => {
    it("ustani bo'shatib qidiruvga qaytaradi", () => {
      // Arrange
      const order = buildOrder({ status: OrderStatus.ASSIGNED, masterId: 'master-1' });

      // Act
      const released = order.releaseForReassignment();

      // Assert
      expect(released.status).toBe(OrderStatus.SEARCHING);
      expect(released.masterId).toBeNull();
    });
  });

  describe('isMasterPhoneVisible (xavfsizlik talabi 6.2)', () => {
    it.each([
      OrderStatus.ASSIGNED,
      OrderStatus.MASTER_EN_ROUTE,
      OrderStatus.ARRIVED_PENDING_CONFIRMATION,
      OrderStatus.IN_PROGRESS,
    ])("%s holatida raqam ko'rinadi", (status) => {
      expect(buildOrder({ status }).isMasterPhoneVisible).toBe(true);
    });

    it.each([
      OrderStatus.SEARCHING,
      OrderStatus.SEARCHING_QUEUED,
      OrderStatus.COMPLETED_BY_MASTER,
      OrderStatus.CLOSED,
      OrderStatus.CANCELLED,
      OrderStatus.SAFETY_FLAGGED,
    ])('%s holatida raqam yashiriladi', (status) => {
      expect(buildOrder({ status }).isMasterPhoneVisible).toBe(false);
    });
  });
});
