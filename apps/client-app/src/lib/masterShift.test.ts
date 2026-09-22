import { describe, expect, it } from 'vitest';
import {
  shiftActionLabel,
  shiftDurationMinutes,
  shiftSinceLine,
  shiftStateLine,
} from './masterShift';

const profile = (patch: Partial<{ isAvailable: boolean; availableSince: Date | null }> = {}) => ({
  isAvailable: false,
  availableSince: null,
  ...patch,
});

const at = (hour: number, minute = 0) => new Date(2026, 8, 16, hour, minute);

describe('shiftStateLine / shiftActionLabel', () => {
  it('yopiq va ochiq smena uchun turli matn', () => {
    expect(shiftStateLine(profile())).toBe('Smena yopiq');
    expect(shiftStateLine(profile({ isAvailable: true }))).toBe('Smenadasiz');
    expect(shiftActionLabel(profile())).toBe('Smenani boshlash');
    expect(shiftActionLabel(profile({ isAvailable: true }))).toBe('Smenani yakunlash');
  });
});

describe('shiftDurationMinutes', () => {
  it('yopiq smenada va boshlanish vaqtisiz — 0', () => {
    expect(shiftDurationMinutes(profile({ availableSince: at(9) }), at(11))).toBe(0);
    expect(shiftDurationMinutes(profile({ isAvailable: true }), at(11))).toBe(0);
  });

  it('ochiq smenada oʻtgan daqiqalarni beradi', () => {
    expect(shiftDurationMinutes(profile({ isAvailable: true, availableSince: at(9) }), at(11))).toBe(
      120,
    );
  });

  it('qurilma soati orqaga surilsa ham manfiy chiqmaydi', () => {
    expect(shiftDurationMinutes(profile({ isAvailable: true, availableSince: at(12) }), at(11))).toBe(
      0,
    );
  });
});

describe('shiftSinceLine', () => {
  it('yopiq smenada qator umuman chizilmaydi', () => {
    expect(shiftSinceLine(profile({ availableSince: at(9) }), at(11))).toBeNull();
  });

  it('ochiq smenada boshlanish vaqti va davomiylik', () => {
    expect(
      shiftSinceLine(profile({ isAvailable: true, availableSince: at(9, 14) }), at(11, 25)),
    ).toBe('09:14 dan beri · 2 soat 11 daqiqa');
  });
});

describe('matn qoidalari', () => {
  it('ASCII apostrof yoʻq', () => {
    const texts = [
      shiftStateLine(profile()),
      shiftStateLine(profile({ isAvailable: true })),
      shiftActionLabel(profile()),
      shiftActionLabel(profile({ isAvailable: true })),
      shiftSinceLine(profile({ isAvailable: true, availableSince: at(9) }), at(11)) ?? '',
    ];
    texts.forEach((text) => expect(text).not.toMatch(/[a-zA-Z]'[a-zA-Z]/));
  });
});
