import { describe, expect, it } from 'vitest';
import {
  AXIS_LOCK_DISTANCE,
  EDGE_MAX_OFFSET,
  lockAxis,
  PREVIEW_MAX_OFFSET,
  previewOffset,
  resolveSwipe,
  SWIPE_RULES,
} from './swipe';

describe('resolveSwipe', () => {
  it('qisqa tez surish chapga → left', () => {
    expect(resolveSwipe({ dx: -72, dy: 6, elapsedMs: 180 })).toBe('left');
  });

  it('oʻngga surish → right', () => {
    expect(resolveSwipe({ dx: 96, dy: -10, elapsedMs: 240 })).toBe('right');
  });

  it('aynan minDistance da qabul qilinadi, undan 1px kam — yoʻq', () => {
    expect(resolveSwipe({ dx: -SWIPE_RULES.minDistance, dy: 0, elapsedMs: 100 })).toBe('left');
    expect(resolveSwipe({ dx: -(SWIPE_RULES.minDistance - 1), dy: 0, elapsedMs: 100 })).toBeNull();
  });

  it('sekin sudrash (800ms dan uzoq) rad etiladi', () => {
    expect(resolveSwipe({ dx: -120, dy: 0, elapsedMs: 801 })).toBeNull();
    expect(resolveSwipe({ dx: -120, dy: 0, elapsedMs: 800 })).toBe('left');
  });

  it('vertikal scroll (dy dx ning 60% idan katta) rad etiladi', () => {
    expect(resolveSwipe({ dx: -60, dy: 40, elapsedMs: 200 })).toBeNull();
    expect(resolveSwipe({ dx: -60, dy: 36, elapsedMs: 200 })).toBe('left');
  });

  it('toza vertikal harakat rad etiladi', () => {
    expect(resolveSwipe({ dx: 0, dy: 140, elapsedMs: 200 })).toBeNull();
  });

  it('manfiy yoki NaN vaqt rad etiladi', () => {
    expect(resolveSwipe({ dx: -80, dy: 0, elapsedMs: -1 })).toBeNull();
    expect(resolveSwipe({ dx: -80, dy: 0, elapsedMs: Number.NaN })).toBeNull();
    expect(resolveSwipe({ dx: Number.NaN, dy: 0, elapsedMs: 100 })).toBeNull();
  });

  it('maxsus qoidalar ishlaydi', () => {
    const rules = { minDistance: 20, maxOffAxisRatio: 1, maxDurationMs: 2000 };
    expect(resolveSwipe({ dx: 24, dy: 24, elapsedMs: 1500 }, rules)).toBe('right');
  });
});

describe('lockAxis', () => {
  it('10px dan kam yoʻl — hali oʻq yoʻq', () => {
    expect(lockAxis(6, 6)).toBeNull();
    expect(lockAxis(AXIS_LOCK_DISTANCE - 1, 0)).toBeNull();
  });

  it('gorizontal ustun → x', () => {
    expect(lockAxis(-12, 4)).toBe('x');
    expect(lockAxis(AXIS_LOCK_DISTANCE, 0)).toBe('x');
  });

  it('vertikal ustun yoki teng → y (scroll gʻolib)', () => {
    expect(lockAxis(4, 12)).toBe('y');
    expect(lockAxis(8, 8)).toBe('y');
  });

  it('NaN → null', () => {
    expect(lockAxis(Number.NaN, 20)).toBeNull();
  });
});

describe('previewOffset', () => {
  it('nol siljish → 0', () => {
    expect(previewOffset(0, true)).toBe(0);
    expect(previewOffset(Number.NaN, true)).toBe(0);
  });

  it('maqsad bor: 40% sudrash, 24px da toʻxtaydi', () => {
    expect(previewOffset(-30, true)).toBe(-12);
    expect(previewOffset(-200, true)).toBe(-PREVIEW_MAX_OFFSET);
    expect(previewOffset(200, true)).toBe(PREVIEW_MAX_OFFSET);
  });

  it('chekka: rezina — 15% va 8px chegara', () => {
    expect(previewOffset(-20, false)).toBe(-3);
    expect(previewOffset(-400, false)).toBe(-EDGE_MAX_OFFSET);
  });
});
