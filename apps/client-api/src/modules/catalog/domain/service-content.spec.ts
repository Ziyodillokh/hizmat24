import {
  beforeAfterPair,
  equipmentItems,
  hasWarranty,
  MAX_FAQ,
  MAX_STEPS,
  parseFaq,
  parseSteps,
  STEP_TITLE_MAX,
} from './service-content';

describe('parseSteps', () => {
  it('toʻgʻri shakldagi bosqichlarni oʻgiradi', () => {
    // Arrange
    const raw = [
      { title: '  Nam tozalash  ', description: '  Nam mikrofiber mato bilan  ' },
      { title: 'Quritish', description: '' },
    ];

    // Act
    const steps = parseSteps(raw);

    // Assert
    expect(steps).toEqual([
      { title: 'Nam tozalash', description: 'Nam mikrofiber mato bilan' },
      { title: 'Quritish', description: '' },
    ]);
  });

  /*
   * Json ustuniga eski versiya yoki qoʻlda `psql` har narsa yozgan
   * boʻlishi mumkin. Bitta buzuq band butun sahifani yiqitmasligi kerak.
   */
  it('buzuq bandlar tashlab yuboriladi, qolgani saqlanadi', () => {
    const steps = parseSteps([
      null,
      'satr',
      { description: 'sarlavhasiz' },
      { title: '   ' },
      { title: 'Yaroqli', description: 'matn' },
      42,
    ]);

    expect(steps).toEqual([{ title: 'Yaroqli', description: 'matn' }]);
  });

  it('massiv boʻlmagan qiymat boʻsh roʻyxat beradi', () => {
    expect(parseSteps(null)).toEqual([]);
    expect(parseSteps(undefined)).toEqual([]);
    expect(parseSteps({ title: 'obyekt' })).toEqual([]);
    expect(parseSteps('matn')).toEqual([]);
  });

  it('juda uzun sarlavha oʻtmaydi', () => {
    expect(parseSteps([{ title: 'a'.repeat(STEP_TITLE_MAX + 1), description: '' }])).toEqual([]);
    expect(parseSteps([{ title: 'a'.repeat(STEP_TITLE_MAX), description: '' }])).toHaveLength(1);
  });

  it('chegaradan ortigʻi kesiladi', () => {
    const many = Array.from({ length: MAX_STEPS + 5 }, (_, index) => ({
      title: `Bosqich ${index}`,
      description: '',
    }));

    expect(parseSteps(many)).toHaveLength(MAX_STEPS);
  });
});

describe('parseFaq', () => {
  it('savol va javob juftligini oʻgiradi', () => {
    expect(parseFaq([{ question: ' Qancha vaqt oladi? ', answer: ' 10 daqiqa ' }])).toEqual([
      { question: 'Qancha vaqt oladi?', answer: '10 daqiqa' },
    ]);
  });

  /* Javobsiz savol foydalanuvchini savol bilan yolgʻiz qoldiradi. */
  it('javobsiz savol koʻrsatilmaydi', () => {
    expect(parseFaq([{ question: 'Savol', answer: '  ' }])).toEqual([]);
    expect(parseFaq([{ question: '', answer: 'Javob' }])).toEqual([]);
  });

  it('chegaradan ortigʻi kesiladi', () => {
    const many = Array.from({ length: MAX_FAQ + 3 }, (_, index) => ({
      question: `Savol ${index}`,
      answer: 'Javob',
    }));

    expect(parseFaq(many)).toHaveLength(MAX_FAQ);
  });
});

describe('hasWarranty', () => {
  it('izoh va summa birga boʻlsa koʻrsatiladi', () => {
    expect(hasWarranty('Zarar qoplanadi', 5_000_000)).toBe(true);
  });

  /* Yarim maʼlumot chalgʻitadi: summasiz vaʼda ham, izohsiz raqam ham. */
  it('yarimta maʼlumot koʻrsatilmaydi', () => {
    expect(hasWarranty('Zarar qoplanadi', null)).toBe(false);
    expect(hasWarranty(null, 5_000_000)).toBe(false);
    expect(hasWarranty('   ', 5_000_000)).toBe(false);
    expect(hasWarranty('Zarar qoplanadi', 0)).toBe(false);
  });
});

describe('beforeAfterPair', () => {
  const media = (role: 'BEFORE' | 'AFTER' | 'GALLERY' | 'EQUIPMENT', url: string) =>
    ({ url, role, caption: null }) as const;

  it('ikkala rasm boʻlsa juftlik qaytadi', () => {
    const pair = beforeAfterPair([
      media('GALLERY', '/a.webp'),
      media('AFTER', '/keyin.webp'),
      media('BEFORE', '/oldin.webp'),
    ]);

    expect(pair).toEqual({ before: '/oldin.webp', after: '/keyin.webp' });
  });

  /* Yolgʻiz «oldin» rasmi yarim buzuq solishtirgich chizardi. */
  it('bittasi yetishmasa juftlik yoʻq', () => {
    expect(beforeAfterPair([media('BEFORE', '/oldin.webp')])).toBeNull();
    expect(beforeAfterPair([media('AFTER', '/keyin.webp')])).toBeNull();
    expect(beforeAfterPair([])).toBeNull();
  });
});

describe('equipmentItems', () => {
  it('faqat uskuna rasmlarini tartibida qaytaradi', () => {
    const items = equipmentItems([
      { url: '/a.webp', role: 'GALLERY', caption: null },
      { url: '/mato.webp', role: 'EQUIPMENT', caption: 'Mikrofiber matolar' },
      { url: '/oldin.webp', role: 'BEFORE', caption: null },
      { url: '/eritma.webp', role: 'EQUIPMENT', caption: 'Tozalash eritmalari' },
    ]);

    expect(items.map((item) => item.caption)).toEqual(['Mikrofiber matolar', 'Tozalash eritmalari']);
  });
});
