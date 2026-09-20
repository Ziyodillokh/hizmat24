import { describe, expect, it } from 'vitest';
import { formatCountdown, idleState, WARNING_THRESHOLD_SECONDS } from './idle';

const NOW = 1_800_000_000_000;
const TIMEOUT = 1800;
const at = (secondsAgo: number) => NOW - secondsAgo * 1000;

describe('faolsizlik holati', () => {
  it('yangi faoliyatdan keyin faol', () => {
    expect(idleState(NOW, NOW, TIMEOUT)).toEqual({ phase: 'active', secondsLeft: TIMEOUT });
  });

  it(`${WARNING_THRESHOLD_SECONDS} soniyadan koʻp qolganda ogohlantirmaydi`, () => {
    const state = idleState(at(TIMEOUT - WARNING_THRESHOLD_SECONDS - 1), NOW, TIMEOUT);
    expect(state.phase).toBe('active');
  });

  it('chegaraga yetganda ogohlantiradi', () => {
    const state = idleState(at(TIMEOUT - WARNING_THRESHOLD_SECONDS), NOW, TIMEOUT);
    expect(state).toEqual({ phase: 'warning', secondsLeft: WARNING_THRESHOLD_SECONDS });
  });

  it('vaqt tugaganda expired', () => {
    expect(idleState(at(TIMEOUT), NOW, TIMEOUT)).toEqual({ phase: 'expired', secondsLeft: 0 });
  });

  it('vaqtdan ancha oʻtgan boʻlsa ham manfiy qaytarmaydi', () => {
    expect(idleState(at(TIMEOUT * 3), NOW, TIMEOUT).secondsLeft).toBe(0);
  });

  it('kompyuter uyquga ketib qaytganda darhol expired boʻladi', () => {
    // Taymerlar uyquda toʻxtaydi; hisob SOATGA tayanadi, tiklarga emas.
    expect(idleState(at(7200), NOW, TIMEOUT).phase).toBe('expired');
  });
});

describe('hisobni formatlash', () => {
  it.each([
    [120, '2:00'],
    [119, '1:59'],
    [61, '1:01'],
    [9, '0:09'],
    [0, '0:00'],
  ])('%i soniya → %s', (seconds, expected) => {
    expect(formatCountdown(seconds)).toBe(expected);
  });

  it('manfiy qiymatda ham 0:00 chiqadi', () => {
    expect(formatCountdown(-5)).toBe('0:00');
  });
});
