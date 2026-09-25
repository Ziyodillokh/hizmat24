import { describe, expect, it } from 'vitest';
import { EMPTY_DRAFT } from '@/app/types';
import { buildInvoice } from './pricing';
import type { SavedAddress } from './savedAddress';
import {
  firstMissingStep, invoiceRows, ORDER_STEP_ROUTES,
  preselectedAddressId, resolveNextRoute, saveOfferHint,
} from './orderFlow';

const saved = (id: string, label: string, name = ''): SavedAddress => ({
  id, kind: 'home', name, address: { label }, createdAt: new Date(2026, 0, 1), lastUsedAt: null,
});



describe('firstMissingStep', () => {
  it('reports category → address → payment in order', () => {
    expect(firstMissingStep(EMPTY_DRAFT, ['category', 'address', 'payment'])?.route).toBe(ORDER_STEP_ROUTES.services);
    expect(firstMissingStep({ ...EMPTY_DRAFT, categoryId: 'c-tap' }, ['category', 'address', 'payment'])?.route).toBe(ORDER_STEP_ROUTES.address);
    expect(firstMissingStep({ ...EMPTY_DRAFT, categoryId: 'c-tap', address: { label: 'A' } }, ['category', 'address', 'payment'])?.route).toBe(ORDER_STEP_ROUTES.payment);
  });
  it('ignores steps outside `need` and returns null when complete', () => {
    expect(firstMissingStep({ ...EMPTY_DRAFT, categoryId: 'c-tap' }, ['category'])).toBeNull();
    expect(firstMissingStep({ ...EMPTY_DRAFT, categoryId: 'c-tap', address: { label: 'A' }, paymentMethod: 'cash' }, ['category', 'address', 'payment'])).toBeNull();
  });
});

describe('resolveNextRoute', () => {
  it('returns to confirm only when returnTo is the confirm route', () => {
    expect(resolveNextRoute('/app/new/address', ORDER_STEP_ROUTES.confirm)).toBe(ORDER_STEP_ROUTES.confirm);
    expect(resolveNextRoute('/app/new/address', '/app/home')).toBe('/app/new/address');
    expect(resolveNextRoute('/app/new/address', null)).toBe('/app/new/address');
  });
});

describe('preselectedAddressId', () => {
  const list = [saved('a', 'Chilonzor 1'), saved('b', 'Yunusobod 2')];
  it('selects the row matching the draft address', () => {
    expect(preselectedAddressId(list, { label: 'yunusobod 2' })).toBe('b');
  });
  it('selects nothing for a manual address and the first row for an empty draft', () => {
    expect(preselectedAddressId(list, { label: 'Sergeli 3' })).toBeNull();
    expect(preselectedAddressId(list, null)).toBe('a');
    expect(preselectedAddressId([], null)).toBeNull();
  });
});

describe('saveOfferHint', () => {
  it('prioritises duplicate, then full, then invalid', () => {
    expect(saveOfferHint({ isValid: true, isFull: true, duplicate: saved('a', 'X', 'Onam') })).toBe('Allaqachon saqlangan: Onam');
    expect(saveOfferHint({ isValid: true, isFull: true })).toContain('toʻlgan');
    expect(saveOfferHint({ isValid: false, isFull: false })).toBe('Avval manzilni yozing');
    expect(saveOfferHint({ isValid: true, isFull: false })).toContain('bir bosishda');
  });
});

describe('invoiceRows', () => {
  it('omits urgent and discount rows when zero', () => {
    const rows = invoiceRows(buildInvoice({ base: 100_000, isUrgent: false, discountPercent: 0 }));
    expect(rows.map((row) => row.key)).toEqual(['base', 'fee']);
  });
  it('includes urgent and discount rows with stable labels', () => {
    const rows = invoiceRows(buildInvoice({ base: 100_000, isUrgent: true, discountPercent: 4 }));
    expect(rows.map((row) => row.key)).toEqual(['base', 'urgent', 'discount', 'fee']);
    expect(rows[2]?.label).toBe('Daraja chegirmasi · 4%');
    expect(rows[2]?.tone).toBe('success');
  });
});
