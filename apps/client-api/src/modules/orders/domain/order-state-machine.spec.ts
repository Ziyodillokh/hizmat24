import { OrderStatus } from '@prisma/client';
import { InvalidStateTransitionException } from '@client/common/exceptions/domain.exception';
import {
  allowedNextStatuses,
  assertTransition,
  canTransition,
  ORDER_TRANSITIONS,
} from './order-state-machine';

describe('order state machine', () => {
  it("barcha holatlar uchun o'tish qoidasi aniqlangan", () => {
    // Arrange
    const allStatuses = Object.values(OrderStatus);

    // Act
    const covered = Object.keys(ORDER_TRANSITIONS);

    // Assert
    expect(covered.sort()).toEqual([...allStatuses].sort());
  });

  it.each([
    [OrderStatus.SEARCHING, OrderStatus.ASSIGNED],
    [OrderStatus.SEARCHING, OrderStatus.SEARCHING_QUEUED],
    [OrderStatus.SEARCHING_QUEUED, OrderStatus.ASSIGNED],
    [OrderStatus.ASSIGNED, OrderStatus.MASTER_EN_ROUTE],
    [OrderStatus.MASTER_EN_ROUTE, OrderStatus.ARRIVED_PENDING_CONFIRMATION],
    [OrderStatus.ARRIVED_PENDING_CONFIRMATION, OrderStatus.IN_PROGRESS],
    [OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED_BY_MASTER],
    [OrderStatus.COMPLETED_BY_MASTER, OrderStatus.RATED],
    [OrderStatus.RATED, OrderStatus.CLOSED],
  ])("%s → %s o'tishiga ruxsat beradi", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it("in_progress dan to'g'ridan-to'g'ri closed ga o'tishni taqiqlaydi", () => {
    expect(canTransition(OrderStatus.IN_PROGRESS, OrderStatus.CLOSED)).toBe(false);
    expect(() => assertTransition(OrderStatus.IN_PROGRESS, OrderStatus.CLOSED)).toThrow(
      InvalidStateTransitionException,
    );
  });

  it('ish boshlangandan keyin bekor qilishni taqiqlaydi', () => {
    expect(canTransition(OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED)).toBe(false);
    expect(canTransition(OrderStatus.COMPLETED_BY_MASTER, OrderStatus.CANCELLED)).toBe(false);
  });

  it("safety_flagged terminal holat — undan chiquvchi yo'l yo'q", () => {
    expect(allowedNextStatuses(OrderStatus.SAFETY_FLAGGED)).toHaveLength(0);
    expect(canTransition(OrderStatus.SAFETY_FLAGGED, OrderStatus.IN_PROGRESS)).toBe(false);
  });

  it.each([OrderStatus.CANCELLED, OrderStatus.CLOSED, OrderStatus.SAFETY_FLAGGED])(
    '%s terminal holat',
    (status) => {
      expect(allowedNextStatuses(status)).toHaveLength(0);
    },
  );

  it("arrived_pending_confirmation dan faqat in_progress yoki safety_flagged ga o'tadi", () => {
    expect([...allowedNextStatuses(OrderStatus.ARRIVED_PENDING_CONFIRMATION)].sort()).toEqual(
      [OrderStatus.IN_PROGRESS, OrderStatus.SAFETY_FLAGGED].sort(),
    );
  });

  it('usta javob bermaganda assigned dan qidiruvga qaytishga ruxsat beradi (TZ 3.4)', () => {
    expect(canTransition(OrderStatus.ASSIGNED, OrderStatus.SEARCHING)).toBe(true);
  });

  it("o'tish jadvali o'zgartirib bo'lmaydigan (frozen) qilib e'lon qilingan", () => {
    expect(Object.isFrozen(ORDER_TRANSITIONS)).toBe(true);
  });

  it("ruxsat etilmagan o'tishda xato tafsilotlarini qaytaradi", () => {
    // Act & Assert
    try {
      assertTransition(OrderStatus.CLOSED, OrderStatus.SEARCHING);
      fail('xato tashlanishi kerak edi');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidStateTransitionException);
      expect((error as InvalidStateTransitionException).code).toBe('INVALID_STATE_TRANSITION');
      expect((error as InvalidStateTransitionException).getStatus()).toBe(409);
    }
  });
});
