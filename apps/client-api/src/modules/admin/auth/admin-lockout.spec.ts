import {
  clearedState,
  LOCK_DURATION_MS,
  lockStatus,
  MAX_FAILED_ATTEMPTS,
  registerFailure,
  type LockState,
} from './admin-lockout';

const NOW = new Date('2026-09-22T10:00:00.000Z');
const fresh: LockState = { failedAttempts: 0, lockedUntil: null };

describe('admin kirish urinishlari cheklovi', () => {
  it('yangi hisob bloklanmagan', () => {
    expect(lockStatus(fresh, NOW)).toEqual({ locked: false, retryAfterSeconds: 0 });
  });

  it(`${MAX_FAILED_ATTEMPTS} - 1 urinishdan keyin hali bloklamaydi`, () => {
    let state = fresh;
    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i += 1) state = registerFailure(state, NOW);

    expect(state.failedAttempts).toBe(MAX_FAILED_ATTEMPTS - 1);
    expect(lockStatus(state, NOW).locked).toBe(false);
  });

  it(`${MAX_FAILED_ATTEMPTS}-urinishda 15 daqiqaga bloklaydi`, () => {
    let state = fresh;
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) state = registerFailure(state, NOW);

    expect(state.lockedUntil).toEqual(new Date(NOW.getTime() + LOCK_DURATION_MS));
    expect(lockStatus(state, NOW)).toEqual({ locked: true, retryAfterSeconds: 900 });
  });

  it('qolgan vaqtni yuqoriga yaxlitlaydi — "0 soniya qoldi" deb aldamaydi', () => {
    const state: LockState = { failedAttempts: 5, lockedUntil: new Date(NOW.getTime() + 1) };

    expect(lockStatus(state, NOW).retryAfterSeconds).toBe(1);
  });

  it('blok muddati tugagan lahzada ochiladi', () => {
    const state: LockState = { failedAttempts: 5, lockedUntil: NOW };

    expect(lockStatus(state, NOW).locked).toBe(false);
  });

  it('blok tugagach sanagich NOLDAN boshlanadi', () => {
    const locked: LockState = { failedAttempts: 5, lockedUntil: NOW };
    const after = new Date(NOW.getTime() + 1000);

    // Eski beshta urinish qoʻshilib ketsa, hisob bitta xatodan qayta
    // bloklanardi — 15 daqiqa kutgan odam uchun bu tuzoq.
    expect(registerFailure(locked, after)).toEqual({ failedAttempts: 1, lockedUntil: null });
  });

  it('muvaffaqiyatli kirish sanagichni va blokni tozalaydi', () => {
    expect(clearedState()).toEqual({ failedAttempts: 0, lockedUntil: null });
  });
});
