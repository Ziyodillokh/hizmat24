import { describe, expect, it } from 'vitest';
import type { ServiceArea } from '@/api/admin';
import {
  areaSummaryLine,
  cityProblem,
  hasChanges,
  latProblem,
  lngProblem,
  parseDecimal,
  radiusProblem,
  RADIUS_MAX,
  saveBlocker,
  toFormState,
  toInput,
} from './serviceAreaForm';

const AREA: ServiceArea = {
  id: 'area-1',
  cityName: 'Namangan',
  centerLat: 40.9983,
  centerLng: 71.6726,
  radiusKm: 12,
  isActive: true,
  sortOrder: 0,
  updatedAt: '2026-09-22T00:00:00.000Z',
};

const ASCII_APOSTROPHE = /'/;

describe('parseDecimal', () => {
  it('oddiy sonni oʻqiydi', () => {
    expect(parseDecimal('40.9983')).toBe(40.9983);
    expect(parseDecimal('12')).toBe(12);
    expect(parseDecimal('-71.5')).toBe(-71.5);
  });

  /*
   * Oʻzbek klaviaturasida oʻnli ajratgich — vergul. «40,9983» deb yozgan
   * odam xato qilmagan va uni rad etish maʼnosiz.
   */
  it('vergulni ham nuqta deb qabul qiladi', () => {
    expect(parseDecimal('40,9983')).toBe(40.9983);
  });

  it('nusxa koʻchirilgan boʻshliqlarni tashlaydi', () => {
    expect(parseDecimal(' 40.9983 ')).toBe(40.9983);
    expect(parseDecimal('40.99\u00A083')).toBe(40.9983);
  });

  it('son boʻlmagan matnda null', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('40.')).toBeNull();
    expect(parseDecimal('qirq')).toBeNull();
    expect(parseDecimal('40.99.83')).toBeNull();
  });
});

describe('maydon tekshiruvlari', () => {
  it('shahar nomi juda qisqa boʻlsa aytadi', () => {
    expect(cityProblem('N')).not.toBeNull();
    expect(cityProblem('Namangan')).toBeNull();
    expect(cityProblem('  Chust  ')).toBeNull();
  });

  it('koordinata chegaradan chiqsa aytadi', () => {
    expect(latProblem('40.9983')).toBeNull();
    expect(latProblem('95')).not.toBeNull();
    expect(lngProblem('71.6726')).toBeNull();
    expect(lngProblem('200')).not.toBeNull();
  });

  it('radius chegarasi serverdagi bilan bir xil', () => {
    expect(radiusProblem('12')).toBeNull();
    expect(radiusProblem('0.5')).not.toBeNull();
    expect(radiusProblem(String(RADIUS_MAX + 1))).toContain(String(RADIUS_MAX));
  });
});

describe('saveBlocker', () => {
  it('toʻgʻri shaklda null', () => {
    expect(saveBlocker(toFormState(AREA))).toBeNull();
  });

  it('birinchi muammoni aytadi', () => {
    expect(saveBlocker({ ...toFormState(AREA), cityName: '' })).toContain('Shahar');
    expect(saveBlocker({ ...toFormState(AREA), radiusKm: '' })).toContain('Radius');
  });
});

describe('toInput / hasChanges', () => {
  it('oʻzgarmagan shaklda boʻsh — server hech narsaga tegmaydi', () => {
    expect(toInput(toFormState(AREA), AREA)).toEqual({});
    expect(hasChanges(toFormState(AREA), AREA)).toBe(false);
  });

  it('faqat oʻzgargan maydon yuboriladi', () => {
    const form = { ...toFormState(AREA), radiusKm: '20' };

    expect(toInput(form, AREA)).toEqual({ radiusKm: 20 });
    expect(hasChanges(form, AREA)).toBe(true);
  });

  it('shahar nomidagi ortiqcha boʻshliq oʻzgarish hisoblanmaydi', () => {
    expect(toInput({ ...toFormState(AREA), cityName: ' Namangan ' }, AREA)).toEqual({});
  });

  it('vergulli koordinata ham toʻgʻri yuboriladi', () => {
    expect(toInput({ ...toFormState(AREA), centerLat: '41,0' }, AREA)).toEqual({ centerLat: 41 });
  });
});

describe('matn qoidalari', () => {
  it('xulosa qatorida markaz va radius bor', () => {
    expect(areaSummaryLine(AREA)).toBe('40.9983, 71.6726 · 12 km');
  });

  it('ASCII apostrof yoʻq', () => {
    const texts = [
      cityProblem('N'),
      latProblem('95'),
      lngProblem('200'),
      radiusProblem('0.5'),
      latProblem('qirq'),
    ];
    for (const text of texts) expect(ASCII_APOSTROPHE.test(text ?? '')).toBe(false);
  });
});
