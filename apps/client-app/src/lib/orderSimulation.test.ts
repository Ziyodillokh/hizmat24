import { describe, expect, it } from 'vitest';
import {
  demoActionLabel,
  etaSourceLine,
  SERVER_STEPS,
  simulationStep,
  simulationTimerKey,
  waitMsFor,
} from './orderSimulation';
import { ORDER_STATUS, type OrderStatus } from './orderStateMachine';

const order = (patch: Partial<{ status: OrderStatus; handledByMaster: boolean }> = {}) => ({
  status: ORDER_STATUS.SEARCHING as OrderStatus,
  handledByMaster: false,
  ...patch,
});

describe('simulationStep', () => {
  it('taymer yoqiq: qidiruvdan tayinlashga', () => {
    expect(simulationStep(order(), false)).toEqual({ next: ORDER_STATUS.ASSIGNED, delayMs: 3500 });
  });

  it('smena ochiq boʻlsa qidiruvdagi buyurtmaga tegmaydi', () => {
    expect(simulationStep(order(), true)).toBeNull();
    expect(simulationStep(order({ status: ORDER_STATUS.SEARCHING_QUEUED }), true)).toBeNull();
  });

  it('smena ochiq, lekin buyurtma allaqachon tayinlangan — taymer davom etadi', () => {
    expect(simulationStep(order({ status: ORDER_STATUS.ASSIGNED }), true)).toEqual({
      next: ORDER_STATUS.MASTER_EN_ROUTE,
      delayMs: 5000,
    });
  });

  it('usta qabul qilgan buyurtmaga hech bir holatda tegmaydi', () => {
    const statuses: OrderStatus[] = [
      ORDER_STATUS.SEARCHING,
      ORDER_STATUS.SEARCHING_QUEUED,
      ORDER_STATUS.ASSIGNED,
      ORDER_STATUS.MASTER_EN_ROUTE,
      ORDER_STATUS.IN_PROGRESS,
    ];
    statuses.forEach((status) => {
      expect(simulationStep(order({ status, handledByMaster: true }), false)).toBeNull();
      expect(simulationStep(order({ status, handledByMaster: true }), true)).toBeNull();
    });
  });

  it('terminal va kutish holatlarida qadam yoʻq', () => {
    [
      ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION,
      ORDER_STATUS.COMPLETED_BY_MASTER,
      ORDER_STATUS.CLOSED,
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.SAFETY_FLAGGED,
    ].forEach((status) => expect(simulationStep(order({ status }), false)).toBeNull());
  });

  it('SERVER_STEPS terminal holatlarni oʻz ichiga olmaydi', () => {
    expect(SERVER_STEPS[ORDER_STATUS.CLOSED]).toBeUndefined();
    expect(SERVER_STEPS[ORDER_STATUS.CANCELLED]).toBeUndefined();
  });
});

describe('waitMsFor', () => {
  const now = new Date(2026, 8, 16, 10, 0);

  it('rejasiz buyurtmada kutish oʻzgarmaydi', () => {
    expect(waitMsFor({ status: ORDER_STATUS.SEARCHING, scheduledAt: null }, 3500, now)).toBe(3500);
  });

  it('rejalashtirilgan buyurtmada birinchi qadam suriladi', () => {
    const scheduledAt = new Date(2026, 8, 16, 10, 0, 10);
    expect(waitMsFor({ status: ORDER_STATUS.SEARCHING, scheduledAt }, 3500, now)).toBe(13_500);
  });

  it('oʻtib ketgan vaqt manfiy kutish bermaydi', () => {
    const scheduledAt = new Date(2026, 8, 16, 9, 0);
    expect(waitMsFor({ status: ORDER_STATUS.SEARCHING, scheduledAt }, 3500, now)).toBe(3500);
  });

  it('qidiruvdan keyingi qadamlar odatdagi tezlikda', () => {
    const scheduledAt = new Date(2026, 8, 17, 10, 0);
    expect(waitMsFor({ status: ORDER_STATUS.ASSIGNED, scheduledAt }, 5000, now)).toBe(5000);
  });
});

describe('simulationTimerKey', () => {
  it('holat kalitning bir qismi', () => {
    expect(simulationTimerKey({ id: 'o1', status: ORDER_STATUS.SEARCHING })).toBe('o1:SEARCHING');
    expect(simulationTimerKey({ id: 'o1', status: ORDER_STATUS.ASSIGNED })).not.toBe(
      simulationTimerKey({ id: 'o1', status: ORDER_STATUS.SEARCHING }),
    );
  });
});

describe('demoActionLabel', () => {
  it('usta yuritayotgan buyurtmada tugma chizilmaydi', () => {
    expect(demoActionLabel(order({ handledByMaster: true }), false)).toBeNull();
    expect(demoActionLabel(order({ status: ORDER_STATUS.ASSIGNED, handledByMaster: true }), false)).toBeNull();
  });

  it('smena ochiq boʻlsa qidiruvdagi buyurtmada ham chizilmaydi', () => {
    expect(demoActionLabel(order(), true)).toBeNull();
  });

  it('holatga mos yorliq', () => {
    expect(demoActionLabel(order(), false)).toBe('ustani darhol topish');
    expect(demoActionLabel(order({ status: ORDER_STATUS.SEARCHING_QUEUED }), false)).toBe(
      'navbatdan chiqarish',
    );
    expect(demoActionLabel(order({ status: ORDER_STATUS.IN_PROGRESS }), false)).toBe(
      'ishni yakunlash',
    );
    expect(demoActionLabel(order({ status: ORDER_STATUS.ASSIGNED }), false)).toBe('keyingi bosqich');
  });
});

describe('etaSourceLine', () => {
  it('vaqt yoʻq boʻlsa buni aytadi', () => {
    expect(etaSourceLine({ etaMinutes: null, handledByMaster: false })).toBe(
      'Usta hali vaqt koʻrsatmadi.',
    );
  });

  it('usta yuritayotgan buyurtmada vaqt manbai — ustaning oʻzi', () => {
    expect(etaSourceLine({ etaMinutes: 20, handledByMaster: true })).toBe(
      'Vaqtni usta oʻzi koʻrsatdi.',
    );
  });

  it('demo yoʻlida vaqt demo ekani aytiladi', () => {
    expect(etaSourceLine({ etaMinutes: 15, handledByMaster: false })).toContain('demo');
  });
});

describe('matn qoidalari', () => {
  it('ASCII apostrof yoʻq', () => {
    const texts = [
      demoActionLabel(order(), false) ?? '',
      demoActionLabel(order({ status: ORDER_STATUS.SEARCHING_QUEUED }), false) ?? '',
      etaSourceLine({ etaMinutes: null, handledByMaster: false }),
      etaSourceLine({ etaMinutes: 20, handledByMaster: true }),
      etaSourceLine({ etaMinutes: 15, handledByMaster: false }),
    ];
    texts.forEach((text) => expect(text).not.toMatch(/[a-zA-Z]'[a-zA-Z]/));
  });
});
