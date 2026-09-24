import { describe, expect, it } from 'vitest';
import type { OrderStatus } from '@/api/admin';
import {
  ACTOR_LABELS,
  ALERT_STATUS_LABELS,
  NOTE_MAX,
  NOTE_MIN,
  ORDER_FILTERS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  reasonProblem,
  REASON_MIN,
  paymentLabel,
  rowTone,
  SAFETY_RESOLUTION_LABELS,
  SAFETY_RESOLUTIONS,
} from './operations';

const ASCII_APOSTROPHE = /'/;

const ALL_STATUSES: OrderStatus[] = [
  'DRAFT',
  'SEARCHING',
  'SEARCHING_QUEUED',
  'ASSIGNED',
  'MASTER_EN_ROUTE',
  'ARRIVED_PENDING_CONFIRMATION',
  'IN_PROGRESS',
  'COMPLETED_BY_MASTER',
  'RATED',
  'CLOSED',
  'CANCELLED',
  'SAFETY_FLAGGED',
];

describe('yorliqlar', () => {
  it('har bir holat uchun nom va rang bor', () => {
    for (const status of ALL_STATUSES) {
      expect(ORDER_STATUS_LABELS[status].length).toBeGreaterThan(0);
      expect(ORDER_STATUS_TONES[status]).toBeTruthy();
    }
  });

  /*
   * `SYSTEM` — avtomatik qidiruv yoki taymer. Uni «operator» deb
   * koʻrsatish kimdir qoʻlda aralashgandek taassurot berardi.
   */
  it('tizim va operator alohida nomlanadi', () => {
    expect(ACTOR_LABELS.SYSTEM).toBe('Tizim');
    expect(ACTOR_LABELS.ADMIN).toBe('Operator');
    expect(ACTOR_LABELS.SYSTEM).not.toBe(ACTOR_LABELS.ADMIN);
  });

  it('filtrlar takrorlanmaydi va «Hammasi» birinchi', () => {
    const keys = ORDER_FILTERS.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys[0]).toBe('ALL');
  });
});

describe('rowTone', () => {
  /*
   * Faqat IKKI holat ajratiladi. Qolganini boʻyash roʻyxatni oʻqib
   * boʻlmas qilardi — rang koʻp boʻlsa, u maʼnosini yoʻqotadi.
   */
  it('xavfsizlik signali — qizil', () => {
    expect(rowTone({ status: 'SAFETY_FLAGGED', isEscalated: false })).toBe('danger');
  });

  it('eskalatsiya — sariq', () => {
    expect(rowTone({ status: 'SEARCHING', isEscalated: true })).toBe('warning');
  });

  it('oddiy qator boʻyalmaydi', () => {
    expect(rowTone({ status: 'IN_PROGRESS', isEscalated: false })).toBeNull();
    expect(rowTone({ status: 'CLOSED', isEscalated: false })).toBeNull();
  });

  it('xavfsizlik eskalatsiyadan ustun', () => {
    expect(rowTone({ status: 'SAFETY_FLAGGED', isEscalated: true })).toBe('danger');
  });
});

describe('reasonProblem', () => {
  it('boʻsh sabab aniq aytiladi', () => {
    expect(reasonProblem('')).toBe('Sababni yozing');
    expect(reasonProblem('   ')).toBe('Sababni yozing');
  });

  it('qisqa sababda qancha yetmasligi koʻrsatiladi', () => {
    const problem = reasonProblem('qisqa');
    expect(problem).toContain(String(REASON_MIN));
    expect(problem).toContain('5');
  });

  it('yetarli sababda muammo yoʻq', () => {
    expect(reasonProblem('Mijoz telefon orqali bekor qilishni soʻradi')).toBeNull();
  });

  it('izoh uchun boshqa chegara berilishi mumkin', () => {
    expect(reasonProblem('a'.repeat(NOTE_MAX + 1), NOTE_MIN, NOTE_MAX)).toContain(String(NOTE_MAX));
  });
});

describe('xavfsizlik xulosalari', () => {
  it('uchta xulosa va har birida izoh bor', () => {
    expect(SAFETY_RESOLUTIONS).toHaveLength(3);
    for (const item of SAFETY_RESOLUTIONS) {
      expect(item.hint.length).toBeGreaterThan(10);
      expect(SAFETY_RESOLUTION_LABELS[item.key]).toBe(item.label);
    }
  });

  it('signal holatlari nomlangan', () => {
    for (const key of ['OPEN', 'ACKNOWLEDGED', 'RESOLVED']) {
      expect(ALERT_STATUS_LABELS[key].length).toBeGreaterThan(0);
    }
  });
});

describe('paymentLabel', () => {
  /** Enum qiymatini ekranda koʻrsatish texnik tafsilotni operatorga yuklardi. */
  it('enum qiymati odam tiliga oʻgiriladi', () => {
    expect(paymentLabel('CASH')).toBe('Naqd');
    expect(paymentLabel('CARD')).toBe('Karta');
  });

  it('tanlanmagan usul aniq aytiladi', () => {
    expect(paymentLabel(null)).toBe('tanlanmagan');
  });

  it('notanish qiymat yashirilmaydi', () => {
    expect(paymentLabel('QANDAYDIR')).toBe('QANDAYDIR');
  });
});

describe('matn qoidalari', () => {
  it('ASCII apostrof yoʻq', () => {
    const texts = [
      ...Object.values(ORDER_STATUS_LABELS),
      ...Object.values(ACTOR_LABELS),
      ...Object.values(ALERT_STATUS_LABELS),
      ...SAFETY_RESOLUTIONS.flatMap((item) => [item.label, item.hint]),
      ...ORDER_FILTERS.map((item) => item.label),
      reasonProblem('') ?? '',
      reasonProblem('qisqa') ?? '',
    ];
    for (const text of texts) expect(ASCII_APOSTROPHE.test(text)).toBe(false);
  });
});
