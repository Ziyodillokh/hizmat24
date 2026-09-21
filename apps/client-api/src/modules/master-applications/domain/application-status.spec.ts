import { MasterApplicationStatus } from '@prisma/client';
import { canTransition, isFinal } from './application-status';

const { PENDING, APPROVED, REJECTED } = MasterApplicationStatus;

describe('ariza holatlari', () => {
  it('kutayotgan ariza tasdiqlanadi yoki rad etiladi', () => {
    expect(canTransition(PENDING, APPROVED)).toBe(true);
    expect(canTransition(PENDING, REJECTED)).toBe(true);
  });

  it.each([
    [APPROVED, REJECTED],
    [REJECTED, APPROVED],
    [APPROVED, PENDING],
    [REJECTED, PENDING],
  ])('%s dan %s ga oʻtib boʻlmaydi', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it('ariza oʻz holatida qolishi ham oʻtish emas', () => {
    for (const status of Object.values(MasterApplicationStatus)) {
      expect(canTransition(status, status)).toBe(false);
    }
  });

  it('koʻrib chiqilgan ariza yakuniy — qayta ochilmaydi', () => {
    expect(isFinal(PENDING)).toBe(false);
    expect(isFinal(APPROVED)).toBe(true);
    expect(isFinal(REJECTED)).toBe(true);
  });
});
