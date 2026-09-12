import { describe, expect, it } from 'vitest';
import {
  ADDRESS_KIND_LABELS,
  ADDRESS_KINDS,
  ADDRESS_LABEL_MIN,
  ADDRESS_LIMIT,
  addressSaveHint,
  addressTitle,
  buildAddress,
  canSaveAddress,
  EMPTY_ADDRESS_FORM,
  findDuplicate,
  isAddressListFull,
  isSameAddress,
  sortAddresses,
  toAddressForm,
  type AddressFormInput,
  type SavedAddress,
} from './savedAddress';

/** Oʻzbek tipografiyasi: ASCII apostrof (U+0027) taqiqlanadi. */
const ASCII_APOSTROPHE = /'/;

const NOW = new Date(2026, 8, 12, 14, 30);
const daysAgo = (days: number): Date => new Date(NOW.getTime() - days * 86_400_000);

function saved(extra: Partial<SavedAddress> = {}): SavedAddress {
  return {
    id: 'a-1',
    kind: 'home',
    name: '',
    address: { label: 'Toshkent, Chilonzor 9-kvartal, 42-uy', entrance: '2', floor: '5', apartment: '34' },
    createdAt: daysAgo(10),
    lastUsedAt: null,
    ...extra,
  };
}

const form = (extra: Partial<AddressFormInput> = {}): AddressFormInput => ({
  ...EMPTY_ADDRESS_FORM,
  label: 'Toshkent, Chilonzor 9-kvartal, 42-uy',
  ...extra,
});

describe('ADDRESS_KIND_LABELS', () => {
  it('uchala tur uchun yorliq bor', () => {
    for (const kind of ADDRESS_KINDS) expect(ADDRESS_KIND_LABELS[kind].length).toBeGreaterThan(0);
  });

  it('ASCII apostrof yoʻq', () => {
    for (const kind of ADDRESS_KINDS) {
      expect(ASCII_APOSTROPHE.test(ADDRESS_KIND_LABELS[kind])).toBe(false);
    }
  });
});

describe('addressTitle', () => {
  it('nom berilgan boʻlsa nomni qaytaradi', () => {
    expect(addressTitle(saved({ name: 'Onamning uyi' }))).toBe('Onamning uyi');
  });

  it('nom boʻsh boʻlsa tur yorligʻini qaytaradi', () => {
    expect(addressTitle(saved({ name: '', kind: 'work' }))).toBe('Ish');
  });

  it('faqat boʻshliqdan iborat nom boʻsh hisoblanadi', () => {
    expect(addressTitle(saved({ name: '   ', kind: 'other' }))).toBe('Boshqa');
  });
});

describe('isSameAddress', () => {
  it('registr va ortiqcha boʻshliq farq qilmaydi', () => {
    expect(
      isSameAddress(
        { label: 'Chilonzor 9-kvartal' },
        { label: '  chilonzor   9-KVARTAL ' },
      ),
    ).toBe(true);
  });

  it('xonadon farq qilsa boshqa manzil', () => {
    expect(
      isSameAddress({ label: 'Chilonzor 9', apartment: '34' }, { label: 'Chilonzor 9', apartment: '35' }),
    ).toBe(false);
  });

  it('boʻsh maydon va berilmagan maydon bir xil hisoblanadi', () => {
    expect(isSameAddress({ label: 'Chilonzor 9', floor: '' }, { label: 'Chilonzor 9' })).toBe(true);
  });

  it('izoh taqqoslashga KIRMAYDI — u manzilni oʻzgartirmaydi', () => {
    expect(
      isSameAddress(
        { label: 'Chilonzor 9', comment: 'itdan ehtiyot boʻling' },
        { label: 'Chilonzor 9' },
      ),
    ).toBe(true);
  });
});

describe('findDuplicate', () => {
  const list = [saved({ id: 'a-1' }), saved({ id: 'a-2', address: { label: 'Yunusobod 4-kvartal' } })];

  it('takror manzilni topadi', () => {
    expect(findDuplicate(list, { label: 'yunusobod 4-kvartal' })?.id).toBe('a-2');
  });

  it('yangi manzilda undefined', () => {
    expect(findDuplicate(list, { label: 'Sergeli 7-kvartal' })).toBeUndefined();
  });

  it('tahrirlashda oʻz yozuvi takror hisoblanmaydi', () => {
    expect(findDuplicate(list, { label: 'Yunusobod 4-kvartal' }, 'a-2')).toBeUndefined();
  });
});

describe('sortAddresses', () => {
  it('oxirgi ishlatilgani birinchi', () => {
    const result = sortAddresses([
      saved({ id: 'old', lastUsedAt: daysAgo(5) }),
      saved({ id: 'fresh', lastUsedAt: daysAgo(1) }),
    ]);
    expect(result.map((item) => item.id)).toEqual(['fresh', 'old']);
  });

  it('ishlatilmaganlar ishlatilganlardan keyin turadi', () => {
    const result = sortAddresses([
      saved({ id: 'never', lastUsedAt: null, createdAt: daysAgo(1) }),
      saved({ id: 'used', lastUsedAt: daysAgo(9) }),
    ]);
    expect(result.map((item) => item.id)).toEqual(['used', 'never']);
  });

  it('ikkisi ham ishlatilmagan boʻlsa yangisi yuqorida', () => {
    const result = sortAddresses([
      saved({ id: 'older', createdAt: daysAgo(9) }),
      saved({ id: 'newer', createdAt: daysAgo(2) }),
    ]);
    expect(result.map((item) => item.id)).toEqual(['newer', 'older']);
  });

  it('kirish massivini OʻZGARTIRMAYDI', () => {
    const input = [saved({ id: 'a' }), saved({ id: 'b', createdAt: NOW })];
    const before = input.map((item) => item.id);
    sortAddresses(input);
    expect(input.map((item) => item.id)).toEqual(before);
  });
});

describe('buildAddress', () => {
  it('boʻsh maydonlar undefined boʻladi — boʻsh satr EMAS', () => {
    const result = buildAddress(form({ entrance: '', floor: '3', apartment: '  ' }));
    expect(result.entrance).toBeUndefined();
    expect(result.apartment).toBeUndefined();
    expect(result.floor).toBe('3');
  });

  it('manzil trim qilinadi', () => {
    expect(buildAddress(form({ label: '  Chilonzor 9  ' })).label).toBe('Chilonzor 9');
  });
});

describe('toAddressForm', () => {
  it('borish va qaytish maʼlumotni yoʻqotmaydi', () => {
    const original = saved({ kind: 'work', name: 'Ofis' });
    const roundTrip = buildAddress(toAddressForm(original));
    expect(isSameAddress(roundTrip, original.address)).toBe(true);
    expect(toAddressForm(original).kind).toBe('work');
    expect(toAddressForm(original).name).toBe('Ofis');
  });

  it('undefined maydon formada boʻsh satr boʻladi', () => {
    const result = toAddressForm(saved({ address: { label: 'Chilonzor 9' } }));
    expect(result.entrance).toBe('');
    expect(result.floor).toBe('');
    expect(result.apartment).toBe('');
  });
});

describe('canSaveAddress va addressSaveHint', () => {
  it('yetarli uzunlikdagi manzil saqlanadi va ishora yoʻq', () => {
    expect(canSaveAddress(form())).toBe(true);
    expect(addressSaveHint(form())).toBeNull();
  });

  it('boʻsh manzilda alohida ishora', () => {
    expect(canSaveAddress(form({ label: '' }))).toBe(false);
    expect(addressSaveHint(form({ label: '' }))).toBe('Manzilni kiriting');
  });

  it('qisqa manzilda eng kam uzunlik aytiladi', () => {
    const short = 'a'.repeat(ADDRESS_LABEL_MIN - 1);
    expect(canSaveAddress(form({ label: short }))).toBe(false);
    expect(addressSaveHint(form({ label: short }))).toContain(String(ADDRESS_LABEL_MIN));
  });

  it('takror manzilda mavjud yozuvning nomi aytiladi', () => {
    const hint = addressSaveHint(form(), saved({ name: 'Uyim' }));
    expect(hint).toContain('Uyim');
  });

  it('nom majburiy EMAS', () => {
    expect(canSaveAddress(form({ name: '' }))).toBe(true);
  });

  it('ishoralarda ASCII apostrof yoʻq', () => {
    const hints = [
      addressSaveHint(form({ label: '' })),
      addressSaveHint(form({ label: 'abc' })),
      addressSaveHint(form(), saved()),
    ];
    for (const hint of hints) expect(ASCII_APOSTROPHE.test(hint ?? '')).toBe(false);
  });
});

describe('isAddressListFull', () => {
  it('chegaraga yetganda toʻlgan hisoblanadi', () => {
    const list = Array.from({ length: ADDRESS_LIMIT }, (_, index) => saved({ id: `a-${index}` }));
    expect(isAddressListFull(list)).toBe(true);
    expect(isAddressListFull(list.slice(1))).toBe(false);
  });
});
