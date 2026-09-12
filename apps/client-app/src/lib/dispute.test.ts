import { describe, expect, it } from 'vitest';
import { formatPrice } from './formatters';
import { ORDER_STATUS } from './orderStateMachine';
import { buildInvoice } from './pricing';
import { NEGATIVE_TAGS } from './rating';
import {
  buildDisputeMessage,
  canSubmitDispute,
  DISPUTE_GOAL_LABELS,
  DISPUTE_GOALS,
  DISPUTE_NOTE_MIN,
  DISPUTE_REASONS,
  disputeHint,
  SAFETY_REASON,
} from './dispute';
import type { LiveOrder, PaymentMethod } from '@/app/types';

/** Oʻzbek tipografiyasi: ASCII apostrof (U+0027) taqiqlanadi. */
const ASCII_APOSTROPHE = /'/;

const NOW = new Date(2026, 8, 12, 14, 30);

function order(extra: Partial<LiveOrder> = {}): LiveOrder {
  return {
    id: 'live-104912',
    shortId: 'HZ-104912',
    categoryId: 'c-tap',
    categoryName: 'Kran taʼmirlash',
    categoryIconKey: 'tap',
    description: 'Oshxonadagi kran oqmoqda',
    invoice: buildInvoice({ base: 150_000, isUrgent: false, discountPercent: 0 }),
    paymentMethod: 'cash' as PaymentMethod,
    scheduledAt: null,
    isUrgent: false,
    address: { label: 'Chilonzor 9-kvartal, 12-uy', entrance: '2', floor: '5', apartment: '34' },
    status: ORDER_STATUS.CLOSED,
    master: {
      id: 'm-akmal',
      fullName: 'Akmal Rahimov',
      profession: 'Santexnik',
      experienceLevel: 'EXPERIENCED',
      hasGovCertificate: true,
      ratingAvg: 4.8,
      completedOrdersCount: 142,
      phoneNumber: '+998901112233',
    },
    etaMinutes: null,
    queuePosition: null,
    createdAt: new Date(2026, 8, 12, 9, 0),
    completedAt: new Date(2026, 8, 12, 12, 30),
    cancelReason: null,
    cancelledBy: null,
    rating: null,
    ...extra,
  };
}

const build = (extra: Partial<Parameters<typeof buildDisputeMessage>[0]> = {}) =>
  buildDisputeMessage({
    order: order(),
    phoneNumber: '+998901234567',
    reason: 'Ish sifatsiz',
    goal: 'fix',
    note: 'Usta ketgach kran yana oqa boshladi.',
    ...extra,
  });

describe('DISPUTE_REASONS', () => {
  it('takrorlanmaydi va boʻsh yozuv yoʻq', () => {
    expect(new Set(DISPUTE_REASONS).size).toBe(DISPUTE_REASONS.length);
    expect(DISPUTE_REASONS.every((item) => item.length > 0)).toBe(true);
  });

  it('baholashdagi salbiy teglar qayta ishlatiladi — yangi lugʻat yasalmagan', () => {
    for (const tag of NEGATIVE_TAGS) expect(DISPUTE_REASONS).toContain(tag);
  });

  it('xavfsizlik turi roʻyxatda bor', () => {
    expect(DISPUTE_REASONS).toContain(SAFETY_REASON);
  });

  it('ASCII apostrof yoʻq', () => {
    for (const item of DISPUTE_REASONS) expect(ASCII_APOSTROPHE.test(item)).toBe(false);
  });
});

describe('DISPUTE_GOAL_LABELS', () => {
  it('uchala kutilma uchun yorliq bor', () => {
    for (const goal of DISPUTE_GOALS) {
      expect(DISPUTE_GOAL_LABELS[goal].length).toBeGreaterThan(0);
      expect(ASCII_APOSTROPHE.test(DISPUTE_GOAL_LABELS[goal])).toBe(false);
    }
  });
});

describe('canSubmitDispute va disputeHint', () => {
  const note = 'x'.repeat(DISPUTE_NOTE_MIN);

  it('uchala maydon ham majburiy', () => {
    expect(canSubmitDispute(null, 'fix', note)).toBe(false);
    expect(canSubmitDispute('Ish sifatsiz', null, note)).toBe(false);
    expect(canSubmitDispute('Ish sifatsiz', 'fix', 'x'.repeat(DISPUTE_NOTE_MIN - 1))).toBe(false);
    expect(canSubmitDispute('Ish sifatsiz', 'fix', note)).toBe(true);
  });

  it('faqat boʻshliqdan iborat izoh hisobga olinmaydi', () => {
    expect(canSubmitDispute('Ish sifatsiz', 'fix', ' '.repeat(40))).toBe(false);
  });

  it('izoh tartib boʻyicha beriladi', () => {
    expect(disputeHint(null, null, '')).toBe('Muammo turini tanlang');
    expect(disputeHint('Ish sifatsiz', null, '')).toBe('Nimani kutayotganingizni tanlang');
    expect(disputeHint('Ish sifatsiz', 'fix', 'qisqa')).toBe('Kamida 10 belgi yozing');
    expect(disputeHint('Ish sifatsiz', 'fix', note)).toBeNull();
  });

  it('izoh yoʻq boʻlsa yuborish ochiq', () => {
    for (const reason of [null, 'Ish sifatsiz']) {
      for (const goal of [null, 'fix'] as const) {
        for (const text of ['', note]) {
          if (disputeHint(reason, goal, text) === null) {
            expect(canSubmitDispute(reason, goal, text)).toBe(true);
          }
        }
      }
    }
  });
});

describe('buildDisputeMessage', () => {
  it('haqiqiy buyurtma maʼlumotini oʻz ichiga oladi', () => {
    const message = build();

    expect(message).toContain('HZ-104912');
    expect(message).toContain('Kran taʼmirlash');
    // `formatPrice` uzilmaydigan probel qoʻyadi — tekshiruv ham shundan chiqadi.
    expect(message).toContain(formatPrice(150_000));
    expect(message).toContain('Naqd');
    expect(message).toContain('Chilonzor 9-kvartal, 12-uy · 2-podez · 5-qavat · 34-xonadon');
    expect(message).toContain('Ish sifatsiz');
    expect(message).toContain('Ish tuzatilsin');
    expect(message).toContain('Usta ketgach kran yana oqa boshladi.');
  });

  it('usta yoʻq boʻlsa boʻsh qiymat belgisi qoʻyiladi', () => {
    const message = build({ order: order({ master: null }) });

    expect(message).toContain('Usta: —');
    expect(message).not.toContain('undefined');
    expect(message).not.toContain('null');
  });

  it('boʻlmagan jarayon haqida soʻz yoʻq', () => {
    expect(build()).not.toMatch(/koʻrib chiqil|operator|muzlat|ariza raqami|24 soat|admin|sugʻurta/i);
  });

  it('soxta identifikator yasalmaydi', () => {
    expect(build()).not.toMatch(/#[A-Z0-9]{4,}/);
  });

  it('sana MUTLAQ yoziladi — matn keyin nusxalansa ham maʼnosi oʻzgarmaydi', () => {
    // `completedAt` = 2026-09-12 12:30. "Bugun" deb yozilsa, matn ertaga
    // nusxalanganda operatorga notoʻgʻri kunni koʻrsatardi.
    expect(build()).toContain('12.09.2026, 12:30');
    for (const word of ['Bugun', 'Kecha', 'Ertaga']) {
      expect(build()).not.toContain(word);
    }
    expect(NOW.getDate()).toBe(12); // sana bugungi kun bilan bir xil boʻlsa ham
  });

  it('sana yorligʻi maʼlumotdan olinadi', () => {
    expect(build()).toContain('Yakunlangan:');
    expect(build({ order: order({ completedAt: null }) })).toContain('Buyurtma sanasi:');
  });

  it('boʻsh maydonlarda qator umuman chizilmaydi', () => {
    expect(build({ order: order({ description: '  ' }) })).not.toContain('Soʻralgan ish');
    expect(build({ phoneNumber: '  ' })).not.toContain('Mening raqamim');
  });

  it('manzil tafsiloti yoʻq boʻlsa ortiqcha ajratkich qolmaydi', () => {
    const message = build({ order: order({ address: { label: 'Chilonzor 12' } }) });
    expect(message).toContain('Manzil: Chilonzor 12\n');
  });

  it('determinik: bir xil kirish bir xil natija beradi', () => {
    expect(build()).toBe(build());
  });

  it('kirish obyektini oʻzgartirmaydi', () => {
    const source = order();
    const snapshot = JSON.stringify(source);
    build({ order: source });
    expect(JSON.stringify(source)).toBe(snapshot);
  });

  it('uzun izohda ham matn oqilona uzunlikda qoladi', () => {
    expect(build({ note: 'x'.repeat(1000) }).length).toBeLessThan(1600);
  });

  it('izoh oxirida ortiqcha boʻsh qator qolmaydi', () => {
    expect(build({ note: '  matn  ' }).endsWith('matn')).toBe(true);
  });
});
