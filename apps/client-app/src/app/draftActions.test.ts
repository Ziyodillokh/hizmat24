import { describe, expect, it } from 'vitest';
import { buildDraftActions } from './draftActions';
import { MAX_QUANTITY } from '@/lib/pricing';
import { EMPTY_DRAFT, type OrderDraft } from './types';

/** `useState` oʻrniga oddiy oʻzgaruvchi — React kerak emas. */
function harness() {
  let state = { draft: { ...EMPTY_DRAFT } };

  const actions = buildDraftActions((update) => {
    state = typeof update === 'function' ? update(state) : update;
  });

  return { actions, read: (): OrderDraft => state.draft };
}

describe('setDraftCategory', () => {
  it('kategoriyani yozadi', () => {
    const { actions, read } = harness();

    actions.setDraftCategory('c-1');

    expect(read().categoryId).toBe('c-1');
  });
});

/*
 * Miqdor chegaradan chiqmasligi kerak: ilova buzilgan qiymat yuborsa,
 * server uni baribir qisadi va mijoz ekranda boshqa summani koʻrardi.
 */
describe('setDraftQuantity', () => {
  it('miqdorni yozadi', () => {
    const { actions, read } = harness();

    actions.setDraftQuantity(3);

    expect(read().quantity).toBe(3);
  });

  it('chegaradan tashqaridagi qiymat qisiladi', () => {
    const { actions, read } = harness();

    actions.setDraftQuantity(0);
    expect(read().quantity).toBe(1);

    actions.setDraftQuantity(-4);
    expect(read().quantity).toBe(1);

    actions.setDraftQuantity(999);
    expect(read().quantity).toBe(MAX_QUANTITY);
  });

  it('kasr son butunlanadi', () => {
    const { actions, read } = harness();

    actions.setDraftQuantity(2.6);

    expect(read().quantity).toBe(3);
  });
});

describe('resetDraft', () => {
  it('miqdor ham boshlangʻich holatga qaytadi', () => {
    const { actions, read } = harness();

    actions.setDraftQuantity(5);
    actions.resetDraft();

    expect(read().quantity).toBe(1);
  });
});
