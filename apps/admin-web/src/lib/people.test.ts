import { describe, expect, it } from 'vitest';
import { shiftLabel, userStatusTone, workHoursLabel } from './people';

describe('workHoursLabel', () => {
  it('soatlarni ikki xonali qilib yozadi', () => {
    expect(workHoursLabel(8, 20)).toBe('08:00 – 20:00');
    expect(workHoursLabel(0, 23)).toBe('00:00 – 23:00');
  });

  /* Bazadagi buzuq qiymat butun ekranni buzmasligi kerak. */
  it('chegaradan chiqqan qiymat qisiladi', () => {
    expect(workHoursLabel(-5, 99)).toBe('00:00 – 23:00');
    expect(workHoursLabel(8.6, 19.4)).toBe('09:00 – 19:00');
  });
});

describe('shiftLabel', () => {
  it('ikki holatni ajratadi', () => {
    expect(shiftLabel(true)).toBe('Smena ochiq');
    expect(shiftLabel(false)).toBe('Smena yopiq');
  });
});

describe('userStatusTone', () => {
  it('holatga mos ohang beradi', () => {
    expect(userStatusTone('ACTIVE')).toBe('success');
    expect(userStatusTone('BLOCKED')).toBe('danger');
  });

  /* Notanish holat qizil boʻlib qoʻrqitmasin. */
  it('notanish holat betaraf', () => {
    expect(userStatusTone('KELAJAK')).toBe('neutral');
  });
});
