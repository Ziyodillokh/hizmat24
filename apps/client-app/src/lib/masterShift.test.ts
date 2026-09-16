import { describe, expect, it } from 'vitest';
import {
  canOpenShift,
  isWithinWorkHours,
  shiftActionLabel,
  shiftHintLine,
  shiftHoursLine,
  shiftStateLine,
} from './masterShift';

const profile = (patch: Partial<{ isAvailable: boolean; workFrom: number; workTo: number }> = {}) => ({
  isAvailable: false,
  workFrom: 9,
  workTo: 18,
  ...patch,
});

const at = (hour: number) => new Date(2026, 8, 16, hour, 30);

describe('shiftStateLine / shiftActionLabel', () => {
  it('yopiq va ochiq smena uchun turli matn', () => {
    expect(shiftStateLine(profile())).toBe('Smena yopiq');
    expect(shiftStateLine(profile({ isAvailable: true }))).toBe('Smenadasiz');
    expect(shiftActionLabel(profile())).toBe('Smenani boshlash');
    expect(shiftActionLabel(profile({ isAvailable: true }))).toBe('Smenani yakunlash');
  });
});

describe('shiftHoursLine', () => {
  it('profil soatlarini koʻrsatadi', () => {
    expect(shiftHoursLine(profile())).toBe('Ish vaqtingiz: 09:00 — 18:00');
  });
});

describe('isWithinWorkHours', () => {
  it('oddiy oyna', () => {
    expect(isWithinWorkHours(profile(), at(10))).toBe(true);
    expect(isWithinWorkHours(profile(), at(20))).toBe(false);
    expect(isWithinWorkHours(profile(), at(9))).toBe(true);
    expect(isWithinWorkHours(profile(), at(18))).toBe(false);
  });

  it('yarim tunni kesib oʻtgan oyna', () => {
    const night = profile({ workFrom: 22, workTo: 6 });
    expect(isWithinWorkHours(night, at(23))).toBe(true);
    expect(isWithinWorkHours(night, at(3))).toBe(true);
    expect(isWithinWorkHours(night, at(12))).toBe(false);
  });

  it('workFrom === workTo — sutkalik ish', () => {
    expect(isWithinWorkHours(profile({ workFrom: 9, workTo: 9 }), at(3))).toBe(true);
  });
});

describe('shiftHintLine', () => {
  it('yopiq smenada izoh yoʻq', () => {
    expect(shiftHintLine(profile(), at(23))).toBeNull();
  });

  it('ish vaqtida ochiq smenada izoh yoʻq', () => {
    expect(shiftHintLine(profile({ isAvailable: true }), at(10))).toBeNull();
  });

  it('ish vaqtidan tashqarida ochiq smena aytiladi', () => {
    expect(shiftHintLine(profile({ isAvailable: true }), at(23))).toBe(
      'Hozir ish vaqtingizdan tashqarisiz — smena baribir ochiq.',
    );
  });
});

describe('canOpenShift', () => {
  it('faqat toʻliq profil bilan', () => {
    expect(canOpenShift(false)).toBe(false);
    expect(canOpenShift(true)).toBe(true);
  });
});

describe('matn qoidalari', () => {
  it('ASCII apostrof yoʻq', () => {
    const texts = [
      shiftStateLine(profile()),
      shiftStateLine(profile({ isAvailable: true })),
      shiftActionLabel(profile()),
      shiftActionLabel(profile({ isAvailable: true })),
      shiftHoursLine(profile()),
      shiftHintLine(profile({ isAvailable: true }), at(23)) ?? '',
    ];
    texts.forEach((text) => expect(text).not.toMatch(/[a-zA-Z]'[a-zA-Z]/));
  });
});
