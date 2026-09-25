import { describe, expect, it } from 'vitest';
import {
  EMPTY_CONTENT,
  MAX_STEPS,
  STEP_TITLE_MAX,
  toContentInput,
  validateContent,
  type ContentFormState,
} from './catalogContent';

const form = (patch: Partial<ContentFormState> = {}): ContentFormState => ({
  ...EMPTY_CONTENT,
  ...patch,
});

describe('validateContent', () => {
  it('boʻsh mazmun muammosiz — hamma blok ixtiyoriy', () => {
    expect(validateContent(form(), null)).toEqual([]);
  });

  /*
   * Butunlay boʻsh qator — admin qoʻshib, fikridan qaytgan. U jimgina
   * tashlanadi va xato deb hisoblanmaydi.
   */
  it('butunlay boʻsh bosqich qatori xato emas', () => {
    expect(validateContent(form({ steps: [{ title: '', description: '' }] }), null)).toEqual([]);
  });

  /* Yozilgan matnni jimgina yoʻqotish — eng yomon xatti-harakat. */
  it('sarlavhasiz, lekin tavsifi yozilgan bosqich — xato', () => {
    const problems = validateContent(form({ steps: [{ title: '', description: 'matn' }] }), null);

    expect(problems).toContain('Har bir bosqichning sarlavhasi boʻlsin.');
  });

  it('javobsiz savol — xato', () => {
    const problems = validateContent(form({ faq: [{ question: 'Savol?', answer: '' }] }), null);

    expect(problems).toContain('Har bir savolning javobi boʻlsin.');
  });

  it('uzun sarlavha va koʻp bosqich aytiladi', () => {
    const many = Array.from({ length: MAX_STEPS + 1 }, () => ({ title: 'Bosqich', description: '' }));
    expect(validateContent(form({ steps: many }), null)).toContain(
      `Bosqichlar ${MAX_STEPS} tadan koʻp boʻlmasin.`,
    );

    const long = [{ title: 'a'.repeat(STEP_TITLE_MAX + 1), description: '' }];
    expect(validateContent(form({ steps: long }), null)).toContain(
      `Bosqich sarlavhasi ${STEP_TITLE_MAX} belgidan uzun boʻlmasin.`,
    );
  });

  /* Summasiz vaʼda ham, izohsiz raqam ham mijozni chalgʻitadi. */
  it('kafolatning yarimtasi xato', () => {
    expect(validateContent(form({ warrantyNote: 'Zarar qoplanadi' }), null)).toEqual([
      'Qoplama izohi bilan birga summa ham yozilsin.',
    ]);
    expect(validateContent(form({ warrantyAmount: '5000000' }), 5_000_000)).toEqual([
      'Qoplama summasi bilan birga izoh ham yozilsin.',
    ]);
  });

  it('toʻliq kafolat muammosiz', () => {
    const problems = validateContent(
      form({ warrantyNote: 'Zarar qoplanadi', warrantyAmount: '5000000' }),
      5_000_000,
    );

    expect(problems).toEqual([]);
  });

  it('nol yoki buzuq summa qabul qilinmaydi', () => {
    expect(validateContent(form({ warrantyNote: 'Izoh', warrantyAmount: '0' }), 0)).toEqual([
      'Qoplama summasi butun musbat son boʻlsin.',
    ]);
  });
});

describe('toContentInput', () => {
  it('boʻsh qatorlar tashlanadi, matnlar qirqiladi', () => {
    const input = toContentInput(
      form({
        steps: [
          { title: '  Nam tozalash  ', description: '  Nam mato  ' },
          { title: '', description: '' },
        ],
        faq: [{ question: ' Savol? ', answer: ' Javob ' }],
        requirements: ['  Suv oʻchirgich  ', '   '],
      }),
      null,
    );

    expect(input.steps).toEqual([{ title: 'Nam tozalash', description: 'Nam mato' }]);
    expect(input.faq).toEqual([{ question: 'Savol?', answer: 'Javob' }]);
    expect(input.requirements).toEqual(['Suv oʻchirgich']);
  });

  /*
   * Blokni TOZALASH uchun boʻsh qiymat ataylab yuboriladi: server PATCH ni
   * qisman qiladi va tushirib qoldirilgan maydon oʻzgarmay qolardi.
   */
  it('boʻsh bloklar ham yuboriladi — tozalash shu bilan ishlaydi', () => {
    const input = toContentInput(form(), null);

    expect(input).toEqual({
      steps: [],
      faq: [],
      requirements: [],
      highlights: [],
      warrantyNote: '',
      warrantyAmount: 0,
    });
  });

  it('izohsiz summa yuborilmaydi', () => {
    const input = toContentInput(form({ warrantyAmount: '5000000' }), 5_000_000);

    expect(input.warrantyAmount).toBe(0);
  });
});
