import { describe, expect, it } from 'vitest';
import {
  acceptBlockedLine,
  ADDRESS_HINT,
  ARRIVE_TOAST,
  CANCEL_SHEET_HINT,
  CANCEL_SHEET_TITLE,
  CANCEL_TOAST,
  CLIENT_CONTACT_HINT,
  COMMISSION_HINT,
  DEPART_TOAST,
  FINISH_TOAST,
  getMasterActions,
  isPrimaryMasterAction,
  MASTER_ACTION_LABELS,
  MASTER_CANCEL_REASONS,
  MASTER_STEPPER_LABELS,
  masterWaitingCard,
  PRICE_FIXED_HINT,
  ACCEPT_TOAST,
  adjacentMasterFilter,
  canAcceptOffer,
  countMasterJobs,
  DECLINE_TOAST,
  ETA_OPTIONS,
  etaOptionLabel,
  ETA_SHEET_HINT,
  ETA_SHEET_TITLE,
  isMyJob,
  isOffer,
  MASTER_EMPTY_CTA_LABELS,
  MASTER_FILTER_LABELS,
  MASTER_FILTERS,
  MASTER_NEXT_STAGE_LINE,
  MASTER_SOURCE_LINE,
  MASTER_STATUS_CHIPS,
  masterEmptyStateFor,
  masterJobFactLine,
  masterWaitingCopy,
  splitMasterJobs,
} from './masterJobs';
import { ORDER_STATUS, STATUS_CHIPS, type OrderStatus } from './orderStateMachine';

const ALL_STATUSES = Object.values(ORDER_STATUS) as OrderStatus[];

const job = (patch: Partial<{ id: string; status: OrderStatus; handledByMaster: boolean; createdAt: Date }> = {}) => ({
  id: 'o1',
  status: ORDER_STATUS.SEARCHING as OrderStatus,
  handledByMaster: false,
  createdAt: new Date(2026, 8, 16, 9, 0),
  ...patch,
});

const open = { declinedIds: [] as string[], isAvailable: true };

describe('MASTER_STATUS_CHIPS', () => {
  it('barcha 10 holatni qamraydi', () => {
    expect(Object.keys(MASTER_STATUS_CHIPS).sort()).toEqual([...ALL_STATUSES].sort());
  });

  it('ton mijoznikidan olinadi, yorliq esa boshqacha', () => {
    ALL_STATUSES.forEach((status) => {
      expect(MASTER_STATUS_CHIPS[status].tone).toBe(STATUS_CHIPS[status].tone);
      expect(MASTER_STATUS_CHIPS[status].label).not.toBe(STATUS_CHIPS[status].label);
    });
  });
});

describe('isOffer / isMyJob', () => {
  it('qidiruvdagi buyurtma — taklif', () => {
    expect(isOffer(job(), [], true)).toBe(true);
    expect(isOffer(job({ status: ORDER_STATUS.SEARCHING_QUEUED }), [], true)).toBe(true);
  });

  it('smena yopiq boʻlsa taklif yoʻq', () => {
    expect(isOffer(job(), [], false)).toBe(false);
  });

  it('rad etilgan buyurtma taklif emas', () => {
    expect(isOffer(job(), ['o1'], true)).toBe(false);
  });

  it('usta olgan buyurtma taklif emas, lekin faol ish', () => {
    const mine = job({ status: ORDER_STATUS.ASSIGNED, handledByMaster: true });
    expect(isOffer(mine, [], true)).toBe(false);
    expect(isMyJob(mine)).toBe(true);
  });

  it('usta olmagan buyurtma hech qachon faol ish emas', () => {
    expect(isMyJob(job({ status: ORDER_STATUS.ASSIGNED }))).toBe(false);
    expect(isMyJob(job({ status: ORDER_STATUS.IN_PROGRESS }))).toBe(false);
  });

  it('yopilgan ish faol emas', () => {
    [ORDER_STATUS.CLOSED, ORDER_STATUS.CANCELLED, ORDER_STATUS.SAFETY_FLAGGED].forEach((status) =>
      expect(isMyJob(job({ status, handledByMaster: true }))).toBe(false),
    );
  });
});

describe('splitMasterJobs / countMasterJobs', () => {
  const orders = [
    job({ id: 'a', createdAt: new Date(2026, 8, 16, 9, 0) }),
    job({ id: 'b', createdAt: new Date(2026, 8, 16, 11, 0) }),
    job({ id: 'c', status: ORDER_STATUS.ASSIGNED, handledByMaster: true }),
    job({ id: 'd', status: ORDER_STATUS.CLOSED, handledByMaster: true }),
    job({ id: 'e', status: ORDER_STATUS.ASSIGNED }),
  ];

  it('ikki zona, yangidan eskiga', () => {
    const view = splitMasterJobs(orders, open);
    expect(view.offers.map((o) => o.id)).toEqual(['b', 'a']);
    expect(view.active.map((o) => o.id)).toEqual(['c']);
  });

  it('kirish massivi oʻzgarmaydi', () => {
    const copy = [...orders];
    splitMasterJobs(orders, open);
    expect(orders).toEqual(copy);
  });

  it('sanoqlar boʻlinish bilan bir xil', () => {
    const counts = countMasterJobs(orders, open);
    expect(counts).toEqual({ offers: 2, active: 1 });
    expect(countMasterJobs(orders, { declinedIds: ['a'], isAvailable: true }).offers).toBe(1);
    expect(countMasterJobs(orders, { declinedIds: [], isAvailable: false }).offers).toBe(0);
  });
});

describe('adjacentMasterFilter', () => {
  it('chekkada null, aylanish yoʻq', () => {
    expect(adjacentMasterFilter('offers', 'left')).toBe('active');
    expect(adjacentMasterFilter('offers', 'right')).toBeNull();
    expect(adjacentMasterFilter('active', 'left')).toBeNull();
    expect(adjacentMasterFilter('active', 'right')).toBe('offers');
  });
});

describe('masterJobFactLine', () => {
  const now = new Date(2026, 8, 16, 12, 0);
  const base = {
    createdAt: new Date(2026, 8, 16, 9, 30),
    scheduledAt: null,
    etaMinutes: null,
    completedAt: null,
    cancelReason: null,
  };

  it('ETA faqat ASSIGNED va MASTER_EN_ROUTE da', () => {
    expect(masterJobFactLine({ ...base, status: ORDER_STATUS.ASSIGNED, etaMinutes: 20 }, now)).toContain('20');
    expect(masterJobFactLine({ ...base, status: ORDER_STATUS.MASTER_EN_ROUTE, etaMinutes: 20 }, now)).toContain('20');
    expect(
      masterJobFactLine({ ...base, status: ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION, etaMinutes: 20 }, now),
    ).toBe('Mijoz tasdigʻini kutyapsiz');
    expect(masterJobFactLine({ ...base, status: ORDER_STATUS.IN_PROGRESS, etaMinutes: 20 }, now)).toBe(
      'Ish davom etmoqda',
    );
  });

  it('ETA yoʻq boʻlsa qator chizilmaydi', () => {
    expect(masterJobFactLine({ ...base, status: ORDER_STATUS.ASSIGNED }, now)).toBeNull();
  });

  it('qidiruvda soʻrov vaqti yoki reja', () => {
    expect(masterJobFactLine({ ...base, status: ORDER_STATUS.SEARCHING }, now)).toBe(
      'Soʻrov 09:30 da keldi',
    );
    expect(
      masterJobFactLine(
        { ...base, status: ORDER_STATUS.SEARCHING, scheduledAt: new Date(2026, 8, 17, 14, 0) },
        now,
      ),
    ).toContain('Rejalashtirilgan');
  });

  it('bekor qilingan ishda faqat sabab boʻlsa yoziladi', () => {
    expect(masterJobFactLine({ ...base, status: ORDER_STATUS.CANCELLED }, now)).toBeNull();
    expect(
      masterJobFactLine({ ...base, status: ORDER_STATUS.CANCELLED, cancelReason: 'Mijoz chiqmadi' }, now),
    ).toBe('Sabab: Mijoz chiqmadi');
  });

  it('barcha holatlar uchun yiqilmaydi', () => {
    ALL_STATUSES.forEach((status) =>
      expect(() => masterJobFactLine({ ...base, status }, now)).not.toThrow(),
    );
  });
});

describe('masterWaitingCopy', () => {
  it('faqat mijoz qadamini kutadigan ikki holatda matn bor', () => {
    expect(masterWaitingCopy(ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION)).not.toBeNull();
    expect(masterWaitingCopy(ORDER_STATUS.COMPLETED_BY_MASTER)).not.toBeNull();
    expect(masterWaitingCopy(ORDER_STATUS.ASSIGNED)).toBeNull();
  });
});

describe('qabul qilish qorovuli', () => {
  it('toʻliq profil va faol ishsiz — ruxsat', () => {
    expect(canAcceptOffer({ isComplete: true, hasActiveJob: false })).toBe(true);
    expect(acceptBlockedLine({ isComplete: true, hasActiveJob: false })).toBeNull();
  });

  it('toʻliq boʻlmagan profil va ikkinchi ish — sabab bilan rad', () => {
    expect(canAcceptOffer({ isComplete: false, hasActiveJob: false })).toBe(false);
    expect(acceptBlockedLine({ isComplete: false, hasActiveJob: false })).toContain('Profil');
    expect(canAcceptOffer({ isComplete: true, hasActiveJob: true })).toBe(false);
    expect(acceptBlockedLine({ isComplete: true, hasActiveJob: true })).toContain('bitta ish');
  });
});

describe('ETA tanlovlari', () => {
  it('oʻsish tartibida va takrorlanmaydi', () => {
    expect([...ETA_OPTIONS]).toEqual([...ETA_OPTIONS].sort((a, b) => a - b));
    expect(new Set(ETA_OPTIONS).size).toBe(ETA_OPTIONS.length);
  });

  it('yorliq daqiqa bilan', () => {
    expect(etaOptionLabel(20)).toContain('20');
    expect(etaOptionLabel(60)).toBeTruthy();
  });
});

describe('masterEmptyStateFor', () => {
  const counts = { offers: 0, active: 0 };

  it('smena yopiq boʻlsa — smenani boshlash', () => {
    expect(masterEmptyStateFor('offers', { isAvailable: false, counts })?.cta).toBe('open-shift');
  });

  it('smena ochiq, taklif yoʻq — mijoz rejimi', () => {
    expect(masterEmptyStateFor('offers', { isAvailable: true, counts })?.cta).toBe('client-mode');
  });

  it('roʻyxat boʻsh emas — boʻsh holat yoʻq', () => {
    expect(masterEmptyStateFor('offers', { isAvailable: true, counts: { offers: 2, active: 0 } })).toBeNull();
    expect(masterEmptyStateFor('active', { isAvailable: true, counts: { offers: 0, active: 1 } })).toBeNull();
  });

  it('faol ish yoʻq — takliflarga', () => {
    expect(masterEmptyStateFor('active', { isAvailable: true, counts })?.cta).toBe('show-offers');
  });
});

describe('matn qoidalari', () => {
  it('ASCII apostrof yoʻq', () => {
    const texts = [
      ...Object.values(MASTER_FILTER_LABELS),
      ...Object.values(MASTER_STATUS_CHIPS).map((chip) => chip.label),
      ...Object.values(MASTER_EMPTY_CTA_LABELS),
      MASTER_SOURCE_LINE,
      DECLINE_TOAST,
      ACCEPT_TOAST,
      MASTER_NEXT_STAGE_LINE,
      ETA_SHEET_TITLE,
      ETA_SHEET_HINT,
      acceptBlockedLine({ isComplete: false, hasActiveJob: false }) ?? '',
      acceptBlockedLine({ isComplete: true, hasActiveJob: true }) ?? '',
    ];
    texts.forEach((text) => expect(text).not.toMatch(/[a-zA-Z]'[a-zA-Z]/));
  });

  it('vaʼda beruvchi soʻzlar yoʻq', () => {
    [MASTER_SOURCE_LINE, DECLINE_TOAST, ACCEPT_TOAST, MASTER_NEXT_STAGE_LINE].forEach((text) => {
      expect(text.toLowerCase()).not.toContain('yuborildi');
      expect(text.toLowerCase()).not.toContain('xabar beramiz');
    });
  });

  it('filtr yorliqlari qisqa', () => {
    MASTER_FILTERS.forEach((filter) =>
      expect(MASTER_FILTER_LABELS[filter].length).toBeLessThanOrEqual(10),
    );
  });
});

describe('getMasterActions', () => {
  it('barcha holatlar qamrab olinadi va yiqilmaydi', () => {
    ALL_STATUSES.forEach((status) => expect(() => getMasterActions(status)).not.toThrow());
  });

  it('mijoz qadamini kutadigan holatlarda holatni suradigan amal yoʻq', () => {
    [ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION, ORDER_STATUS.COMPLETED_BY_MASTER].forEach((status) => {
      const actions = getMasterActions(status);
      expect(actions.some(isPrimaryMasterAction)).toBe(false);
      expect(masterWaitingCard(status)).not.toBeNull();
    });
  });

  it('bekor qilish faqat ASSIGNED va MASTER_EN_ROUTE da', () => {
    expect(getMasterActions(ORDER_STATUS.ASSIGNED)).toContain('cancel');
    expect(getMasterActions(ORDER_STATUS.MASTER_EN_ROUTE)).toContain('cancel');
    ALL_STATUSES.filter(
      (status) => status !== ORDER_STATUS.ASSIGNED && status !== ORDER_STATUS.MASTER_EN_ROUTE,
    ).forEach((status) => expect(getMasterActions(status)).not.toContain('cancel'));
  });

  it('yopilgan ishda amal yoʻq, bekor va xavfsizlikda faqat yordam', () => {
    expect(getMasterActions(ORDER_STATUS.CLOSED)).toHaveLength(0);
    expect(getMasterActions(ORDER_STATUS.CANCELLED)).toEqual(['support']);
    expect(getMasterActions(ORDER_STATUS.SAFETY_FLAGGED)).toEqual(['support']);
  });

  it('har bir holatda koʻpi bilan bitta asosiy amal', () => {
    ALL_STATUSES.forEach((status) =>
      expect(getMasterActions(status).filter(isPrimaryMasterAction).length).toBeLessThanOrEqual(1),
    );
  });
});

describe('M3 matnlari', () => {
  it('ASCII apostrof yoʻq', () => {
    const texts = [
      ...Object.values(MASTER_ACTION_LABELS),
      ...MASTER_CANCEL_REASONS,
      ...MASTER_STEPPER_LABELS,
      CANCEL_SHEET_TITLE,
      CANCEL_SHEET_HINT,
      ADDRESS_HINT,
      PRICE_FIXED_HINT,
      COMMISSION_HINT,
      CLIENT_CONTACT_HINT,
      DEPART_TOAST,
      ARRIVE_TOAST,
      CANCEL_TOAST,
      FINISH_TOAST,
      masterWaitingCard(ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION)?.description ?? '',
      masterWaitingCard(ORDER_STATUS.COMPLETED_BY_MASTER)?.description ?? '',
    ];
    texts.forEach((text) => expect(text).not.toMatch(/[a-zA-Z]'[a-zA-Z]/));
  });

  it('stepper beshta qadam — mijoznikidek', () => {
    expect(MASTER_STEPPER_LABELS).toHaveLength(5);
  });

  it('bekor sabablari erkin matn emas, tanlov', () => {
    expect(MASTER_CANCEL_REASONS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(MASTER_CANCEL_REASONS).size).toBe(MASTER_CANCEL_REASONS.length);
  });
});
