import {
  addressCoverageProblem,
  canonicalCity,
  cityNamesLine,
  isPointInside,
  labelMentionsCity,
  type ServiceAreaView,
} from './service-area-rules';

const NAMANGAN: ServiceAreaView = {
  cityName: 'Namangan',
  centerLat: 40.9983,
  centerLng: 71.6726,
  radiusKm: 12,
};

const AREAS = [NAMANGAN];

describe('canonicalCity', () => {
  it('registr, apostrof va tinish belgilarini tenglashtiradi', () => {
    expect(canonicalCity('Namangan')).toBe(canonicalCity('NAMANGAN'));
    expect(canonicalCity('Qoʻqon')).toBe(canonicalCity("Qo'qon"));
    expect(canonicalCity('Namangan, sh.')).toBe('namangan sh');
  });
});

describe('isPointInside', () => {
  it('markaz — doim ichkarida', () => {
    expect(isPointInside(NAMANGAN, NAMANGAN.centerLat, NAMANGAN.centerLng)).toBe(true);
  });

  it('shahar ichidagi nuqta qabul qilinadi', () => {
    // Markazdan ~3 km shimolda.
    expect(isPointInside(NAMANGAN, 41.025, 71.6726)).toBe(true);
  });

  it('Toshkent rad etiladi — 280 km narida', () => {
    expect(isPointInside(NAMANGAN, 41.3111, 69.2406)).toBe(false);
  });

  it('chegaraning oʻzi ichkarida hisoblanadi', () => {
    // 1 kenglik darajasi ≈ 111 km; 12 km ≈ 0.1081 daraja.
    expect(isPointInside(NAMANGAN, NAMANGAN.centerLat + 0.1, NAMANGAN.centerLng)).toBe(true);
    expect(isPointInside(NAMANGAN, NAMANGAN.centerLat + 0.2, NAMANGAN.centerLng)).toBe(false);
  });
});

describe('labelMentionsCity', () => {
  it('shahar nomi matnda boʻlsa qabul qiladi — qayerda turishidan qatʼi nazar', () => {
    expect(labelMentionsCity(NAMANGAN, 'Namangan shahri, Boburshoh koʻchasi 12')).toBe(true);
    expect(labelMentionsCity(NAMANGAN, 'namangan, uychi koʻchasi 5')).toBe(true);
  });

  it('boshqa shahar rad etiladi', () => {
    expect(labelMentionsCity(NAMANGAN, 'Toshkent, Chilonzor 9-kvartal')).toBe(false);
  });
});

describe('addressCoverageProblem', () => {
  it('hududdagi koordinata qabul qilinadi', () => {
    expect(
      addressCoverageProblem(AREAS, { label: 'Koʻcha 1', lat: 41.0, lng: 71.67 }),
    ).toBeNull();
  });

  /*
   * Koordinata MATNDAN ustun: «Namangan koʻchasi, Toshkent» degan manzil
   * matn boʻyicha oʻtib ketardi. Shuning uchun koordinata bor boʻlsa,
   * matnga umuman qaralmaydi.
   */
  it('koordinata hududdan tashqarida boʻlsa matn yordam bermaydi', () => {
    const problem = addressCoverageProblem(AREAS, {
      label: 'Namangan koʻchasi, Toshkent',
      lat: 41.3111,
      lng: 69.2406,
    });

    expect(problem).toContain('Namangan');
  });

  it('koordinatasiz manzil matn boʻyicha tekshiriladi', () => {
    expect(addressCoverageProblem(AREAS, { label: 'Namangan, Uychi 5' })).toBeNull();
    expect(addressCoverageProblem(AREAS, { label: 'Toshkent, Chilonzor 9' })).not.toBeNull();
  });

  it('yarim koordinata (faqat lat) matn yoʻliga tushadi', () => {
    expect(addressCoverageProblem(AREAS, { label: 'Namangan, Uychi 5', lat: 41 })).toBeNull();
    expect(addressCoverageProblem(AREAS, { label: 'Toshkent', lat: 41 })).not.toBeNull();
  });

  it('faol hudud boʻlmasa buyurtma qabul qilinmaydi', () => {
    expect(addressCoverageProblem([], { label: 'Namangan, Uychi 5' })).not.toBeNull();
  });

  it('ikkinchi shahar qoʻshilsa ikkalasi ham qabul qilinadi', () => {
    const chust: ServiceAreaView = {
      cityName: 'Chust',
      centerLat: 41.0,
      centerLng: 71.24,
      radiusKm: 8,
    };

    expect(addressCoverageProblem([NAMANGAN, chust], { label: 'Chust, Bogʻ koʻchasi 3' })).toBeNull();
    expect(cityNamesLine([NAMANGAN, chust])).toBe('Namangan, Chust');
  });

  it('xabarda ASCII apostrof yoʻq', () => {
    const problem = addressCoverageProblem(AREAS, { label: 'Toshkent' }) ?? '';
    expect(problem).not.toMatch(/[a-zA-Z]'[a-zA-Z]/);
  });
});
