import { describe, expect, it } from 'vitest';
import {
  cityBadge,
  FALLBACK_CITY,
  mentionsCity,
  STREET_MIN,
  streetProblem,
  withCity,
  withoutCity,
} from './serviceArea';

const CITY = 'Namangan';

describe('cityBadge', () => {
  it('shahar belgisini yasaydi', () => {
    expect(cityBadge(CITY)).toBe('Namangan shahri');
  });
});

describe('mentionsCity', () => {
  it('registr va apostrofga qaramaydi', () => {
    expect(mentionsCity('NAMANGAN, Uychi 5', CITY)).toBe(true);
    expect(mentionsCity('Toshkent, Chilonzor', CITY)).toBe(false);
  });
});

describe('withCity', () => {
  it('shahar nomini boshiga qoʻshadi', () => {
    expect(withCity('Boburshoh koʻchasi 12', CITY)).toBe('Namangan, Boburshoh koʻchasi 12');
  });

  /*
   * Odam odatdagidek «Namangan, …» deb yozib qoʻyishi mumkin. Shaharni
   * ikki marta qoʻshish manzilni kulgili qilardi va usta uni oʻqiydi.
   */
  it('shahar allaqachon yozilgan boʻlsa takrorlamaydi', () => {
    expect(withCity('Namangan, Uychi 5', CITY)).toBe('Namangan, Uychi 5');
    expect(withCity('namangan shahri, Uychi 5', CITY)).toBe('namangan shahri, Uychi 5');
  });

  it('boshidagi ortiqcha vergul va boʻshliq tozalanadi', () => {
    expect(withCity('  , Uychi 5', CITY)).toBe('Namangan, Uychi 5');
  });

  it('boʻsh matnda faqat shahar qoladi', () => {
    expect(withCity('   ', CITY)).toBe(CITY);
  });
});

describe('withoutCity', () => {
  it('boshidagi shahar nomini olib tashlaydi', () => {
    expect(withoutCity('Namangan, Uychi 5', CITY)).toBe('Uychi 5');
    expect(withoutCity('namangan Uychi 5', CITY)).toBe('Uychi 5');
  });

  it('matn oʻrtasidagi shahar nomiga TEGMAYDI', () => {
    expect(withoutCity('Uychi koʻchasi, Namangan bozori yonida', CITY)).toBe(
      'Uychi koʻchasi, Namangan bozori yonida',
    );
  });

  it('boshqa shahardagi manzilni buzmaydi', () => {
    expect(withoutCity('Toshkent, Chilonzor 9', CITY)).toBe('Toshkent, Chilonzor 9');
  });

  it('withCity bilan borib-kelish matnni saqlaydi', () => {
    const rest = 'Uychi koʻchasi 5';
    expect(withoutCity(withCity(rest, CITY), CITY)).toBe(rest);
  });
});

describe('zaxira qiymat', () => {
  it('server javob bermaganda ishlatiladigan shahar', () => {
    expect(FALLBACK_CITY).toBe('Namangan');
    expect(cityBadge(FALLBACK_CITY)).not.toMatch(/[a-zA-Z]'[a-zA-Z]/);
  });
});

describe('streetProblem', () => {
  /*
   * Shahar ekranda qulflangani uchun umumiy uzunlik tekshiruvi aldardi:
   * «Namangan, A» ham 11 belgi. Usta oʻqiydigan qism alohida tekshiriladi.
   */
  it('boʻsh koʻcha maydonini aniq aytadi', () => {
    expect(streetProblem('')).toContain('Koʻcha');
    expect(streetProblem('   ')).toContain('Koʻcha');
  });

  it('juda qisqa manzilda eng kam uzunlikni aytadi', () => {
    expect(streetProblem('A')).toContain(String(STREET_MIN));
  });

  it('toʻliq manzilda muammo yoʻq', () => {
    expect(streetProblem('Uychi koʻchasi 5')).toBeNull();
  });

  it('ASCII apostrof yoʻq', () => {
    for (const text of [streetProblem(''), streetProblem('A')]) {
      expect(text ?? '').not.toMatch(/[a-zA-Z]'[a-zA-Z]/);
    }
  });
});
