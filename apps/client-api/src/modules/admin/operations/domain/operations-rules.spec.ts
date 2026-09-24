import { OrderStatus, SafetyAlertStatus } from '@prisma/client';
import { MAX_ASSIGNMENT_ATTEMPTS } from '@shared/index';
import {
  adminCancelProblem,
  isEscalated,
  requeueProblem,
  resolveProblem,
  suggestsBlock,
} from './operations-rules';

const order = (status: OrderStatus, attempts = 0) => ({ status, assignmentAttempts: attempts });

describe('isEscalated', () => {
  /*
   * Eskalatsiya — HISOBLANADIGAN holat, ustun emas. Ustun qoʻshilsa, u
   * haqiqat bilan ajralib qolishi mumkin: usta topilib, bayroq
   * oʻchirilmasdan qolsa, panel boʻlmagan muammoni koʻrsatardi.
   */
  it('urinishlar tugagan va qidiruv davom etayotgan buyurtma', () => {
    expect(isEscalated(order(OrderStatus.SEARCHING, MAX_ASSIGNMENT_ATTEMPTS))).toBe(true);
    expect(isEscalated(order(OrderStatus.SEARCHING_QUEUED, MAX_ASSIGNMENT_ATTEMPTS + 2))).toBe(true);
  });

  it('urinishlar tugamagan boʻlsa — yoʻq', () => {
    expect(isEscalated(order(OrderStatus.SEARCHING, MAX_ASSIGNMENT_ATTEMPTS - 1))).toBe(false);
  });

  it('usta topilgan buyurtma eskalatsiyada emas', () => {
    expect(isEscalated(order(OrderStatus.ASSIGNED, MAX_ASSIGNMENT_ATTEMPTS))).toBe(false);
    expect(isEscalated(order(OrderStatus.IN_PROGRESS, MAX_ASSIGNMENT_ATTEMPTS))).toBe(false);
  });
});

describe('requeueProblem', () => {
  it('qidiruvdagi buyurtmada muammo yoʻq', () => {
    expect(requeueProblem(order(OrderStatus.SEARCHING, 5))).toBeNull();
    expect(requeueProblem(order(OrderStatus.SEARCHING_QUEUED, 5))).toBeNull();
  });

  /*
   * Ustasi bor buyurtmani qidiruvga qaytarish — ustani ishdan ayirish
   * va mijozni chalgʻitish. Bunga alohida qaror kerak.
   */
  it('ustasi bor buyurtma qayta qidiruvga qoʻyilmaydi', () => {
    expect(requeueProblem(order(OrderStatus.ASSIGNED))).not.toBeNull();
    expect(requeueProblem(order(OrderStatus.MASTER_EN_ROUTE))).not.toBeNull();
  });

  it('yopilgan buyurtma ham qaytarilmaydi', () => {
    expect(requeueProblem(order(OrderStatus.CLOSED))).not.toBeNull();
    expect(requeueProblem(order(OrderStatus.CANCELLED))).not.toBeNull();
  });
});

describe('adminCancelProblem', () => {
  it.each([
    OrderStatus.SEARCHING,
    OrderStatus.SEARCHING_QUEUED,
    OrderStatus.ASSIGNED,
    OrderStatus.MASTER_EN_ROUTE,
    OrderStatus.ARRIVED_PENDING_CONFIRMATION,
    OrderStatus.IN_PROGRESS,
  ])('%s — bekor qilinadi', (status) => {
    expect(adminCancelProblem(order(status))).toBeNull();
  });

  it.each([OrderStatus.CLOSED, OrderStatus.CANCELLED, OrderStatus.RATED])(
    '%s — bekor qilinmaydi',
    (status) => {
      expect(adminCancelProblem(order(status))).not.toBeNull();
    },
  );

  /*
   * `SAFETY_FLAGGED` — terminal holat va u OʻZGARTIRILMAYDI (A4 qabul
   * sharti): mijoz ustani rad etgan hodisa tarixda oʻz holicha qolishi
   * kerak.
   */
  it('xavfsizlik bayrogʻi qoʻyilgan buyurtmaga tegilmaydi', () => {
    const problem = adminCancelProblem(order(OrderStatus.SAFETY_FLAGGED));

    expect(problem).not.toBeNull();
    // «Allaqachon yopilgan» degan umumiy jumla bu yerda notoʻgʻri:
    // buyurtma yopilmagan, unga ATAYLAB tegilmaydi.
    expect(problem).toContain('Xavfsizlik');
    expect(problem).not.toContain('yopilgan');
  });
});

describe('resolveProblem', () => {
  it('ochiq signal yopiladi', () => {
    expect(resolveProblem(SafetyAlertStatus.OPEN)).toBeNull();
    expect(resolveProblem(SafetyAlertStatus.ACKNOWLEDGED)).toBeNull();
  });

  it('yopilgan signal ikkinchi marta yopilmaydi', () => {
    expect(resolveProblem(SafetyAlertStatus.RESOLVED)).toContain('allaqachon');
  });
});

describe('suggestsBlock', () => {
  /** Bloklash AVTOMATIK emas — operator tugmani alohida bosadi. */
  it('faqat tasdiqlangan hodisada bloklash taklif qilinadi', () => {
    expect(suggestsBlock('CONFIRMED')).toBe(true);
    expect(suggestsBlock('FALSE_ALARM')).toBe(false);
    expect(suggestsBlock('NO_CONTACT')).toBe(false);
  });
});

describe('matn qoidalari', () => {
  it('ASCII apostrof yoʻq', () => {
    const texts = [
      requeueProblem(order(OrderStatus.ASSIGNED)),
      adminCancelProblem(order(OrderStatus.CLOSED)),
      resolveProblem(SafetyAlertStatus.RESOLVED),
    ];
    for (const text of texts) expect(text ?? '').not.toMatch(/[a-zA-Z]'[a-zA-Z]/);
  });
});
