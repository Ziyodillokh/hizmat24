import { describe, expect, it } from 'vitest';
import { ORDER_STATUS, type OrderStatus } from './orderStateMachine';
import { receiptHeadline } from './receipt';
import type { PaymentMethod } from '@/app/types';

/** Oʻzbek tipografiyasi: ASCII apostrof (U+0027) taqiqlanadi. */
const ASCII_APOSTROPHE = /'/;

const NOW = new Date(2026, 8, 13, 10, 0);

const order = (
  status: OrderStatus,
  extra: { scheduledAt?: Date | null; paymentMethod?: PaymentMethod } = {},
) => ({
  status,
  scheduledAt: extra.scheduledAt ?? null,
  paymentMethod: extra.paymentMethod ?? ('cash' as PaymentMethod),
});

describe('receiptHeadline', () => {
  it('qidiruv boshlangan naqd buyurtma — pul yechilmagani aytiladi', () => {
    const h = receiptHeadline(order(ORDER_STATUS.SEARCHING), NOW);
    expect(h.title).toBe('Buyurtma qabul qilindi');
    expect(h.body.startsWith('Usta qidiruvi boshlandi.')).toBe(true);
    expect(h.body).toContain('naqd');
    expect(h.tone).toBe('success');
  });

  it('navbatdagi buyurtma — navbat aytiladi', () => {
    expect(receiptHeadline(order(ORDER_STATUS.SEARCHING_QUEUED), NOW).body).toContain('navbatga');
  });

  it('kelajakka rejalashtirilgan — qidiruv qachon boshlanishi aytiladi', () => {
    const h = receiptHeadline(order(ORDER_STATUS.SEARCHING, { scheduledAt: new Date(2026, 8, 14, 12, 0) }), NOW);
    expect(h.body).toContain('da boshlanadi');
  });

  it('oʻtib ketgan rejalashtirilgan vaqt — "boshlandi" ga tushadi', () => {
    const h = receiptHeadline(order(ORDER_STATUS.SEARCHING, { scheduledAt: new Date(2026, 8, 12, 12, 0) }), NOW);
    expect(h.body).toContain('boshlandi');
    expect(h.body).not.toContain('da boshlanadi');
  });

  it('karta usuli — onlayn toʻlov ulanmagani aytiladi', () => {
    expect(receiptHeadline(order(ORDER_STATUS.SEARCHING, { paymentMethod: 'card' }), NOW).body).toContain('ulanmagan');
  });

  it('usta yakunlagan — tasdiqlash kutilmoqda', () => {
    const h = receiptHeadline(order(ORDER_STATUS.COMPLETED_BY_MASTER), NOW);
    expect(h.title).toBe('Ish yakunlandi');
    expect(h.tone).toBe('success');
  });

  it('yopilgan — toʻlangan va usul aytiladi', () => {
    const h = receiptHeadline(order(ORDER_STATUS.CLOSED), NOW);
    expect(h.title).toBe('Toʻlandi');
    expect(h.body).toBe('Toʻlov usuli: Naqd.');
  });

  it('bekor qilingan — ogohlantirish tusi, pul yechilmagan', () => {
    const h = receiptHeadline(order(ORDER_STATUS.CANCELLED), NOW);
    expect(h.tone).toBe('warning');
    expect(h.body).toContain('yechilmagan');
  });

  it('matnlarda ASCII apostrof yoʻq', () => {
    for (const status of Object.values(ORDER_STATUS)) {
      const h = receiptHeadline(order(status), NOW);
      expect(ASCII_APOSTROPHE.test(h.title + h.body)).toBe(false);
    }
  });
});
