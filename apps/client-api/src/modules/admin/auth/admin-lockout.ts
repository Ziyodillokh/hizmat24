/**
 * Kirish urinishlarini cheklash — SOF mantiq, bazasiz va soatsiz.
 *
 * Hisob bloklanishi baza yozuvidagi ikki maydondan quriladi
 * (`failedAttempts`, `lockedUntil`), shuning uchun u bir necha server
 * nusxasi ishlaganda ham bitta haqiqatga tayanadi — xotiradagi sanagich
 * har bir nusxada alohida boʻlib, hujumchiga N barobar urinish berardi.
 */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

export interface LockState {
  failedAttempts: number;
  lockedUntil: Date | null;
}

export interface LockDecision {
  locked: boolean;
  /** Qancha kutish kerakligi — foydalanuvchiga soniyada aytiladi. */
  retryAfterSeconds: number;
}

/** Hozir bloklanganmi va yana qancha qolgan. */
export function lockStatus(state: LockState, now: Date): LockDecision {
  if (!state.lockedUntil || state.lockedUntil.getTime() <= now.getTime()) {
    return { locked: false, retryAfterSeconds: 0 };
  }

  return {
    locked: true,
    retryAfterSeconds: Math.ceil((state.lockedUntil.getTime() - now.getTime()) / 1000),
  };
}

/**
 * Navbatdagi muvaffaqiyatsiz urinishdan keyingi holat.
 *
 * Blok muddati oʻtgan boʻlsa sanagich noldan boshlanadi: eski beshta
 * urinish bilan bugungi bitta urinish qoʻshilib, hisob darhol qayta
 * bloklanib qolmasligi kerak.
 */
export function registerFailure(state: LockState, now: Date): LockState {
  const expired = state.lockedUntil !== null && state.lockedUntil.getTime() <= now.getTime();
  const attempts = (expired ? 0 : state.failedAttempts) + 1;

  return attempts >= MAX_FAILED_ATTEMPTS
    ? { failedAttempts: attempts, lockedUntil: new Date(now.getTime() + LOCK_DURATION_MS) }
    : { failedAttempts: attempts, lockedUntil: null };
}

/** Muvaffaqiyatli kirish hamma narsani tozalaydi. */
export const clearedState = (): LockState => ({ failedAttempts: 0, lockedUntil: null });
