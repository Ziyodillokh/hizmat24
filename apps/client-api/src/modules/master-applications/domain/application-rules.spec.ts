import {
  MAX_ABOUT_LENGTH,
  MAX_DISTRICTS,
  MAX_REQUESTED_CATEGORIES,
  MIN_ABOUT_LENGTH,
  assessApplication,
  normalizeDraft,
  toStoredApplication,
  type ApplicationDraft,
} from './application-rules';

const validDraft = (overrides: Partial<ApplicationDraft> = {}): ApplicationDraft => ({
  fullName: 'Alisher Karimov',
  profession: 'Santexnik',
  about: 'Sakkiz yildan beri santexnika bilan shugʻullanaman, quvur va smesitel almashtiraman.',
  districts: ['Chilonzor', 'Yunusobod'],
  workFrom: 9,
  workTo: 18,
  requestedCategoryIds: ['11111111-1111-4111-8111-111111111111'],
  ...overrides,
});

describe('assessApplication', () => {
  it('toʻgʻri toʻldirilgan arizani qabul qiladi', () => {
    expect(assessApplication(validDraft())).toEqual({ ok: true, problems: [] });
  });

  it('barcha muammolarni birdaniga qaytaradi — odam birma-bir topmaydi', () => {
    const verdict = assessApplication(
      validDraft({ fullName: 'Ali', about: 'qisqa', profession: 'ab', workFrom: 9, workTo: 9 }),
    );

    expect(verdict.ok).toBe(false);
    expect(verdict.problems.length).toBeGreaterThanOrEqual(3);
  });

  describe('ish vaqti', () => {
    it.each([-1, 24, 9.5, Number.NaN])('%p soat sifatida qabul qilinmaydi', (hour) => {
      expect(assessApplication(validDraft({ workFrom: hour })).ok).toBe(false);
    });

    it('boshlanish va tugash soati bir xil boʻlishi mumkin emas', () => {
      const verdict = assessApplication(validDraft({ workFrom: 9, workTo: 9 }));

      expect(verdict.ok).toBe(false);
      expect(verdict.problems[0]).toContain('bir xil boʻlmasin');
    });

    it('tungi smena (22 → 6) ATAYLAB ruxsat etilgan', () => {
      expect(assessApplication(validDraft({ workFrom: 22, workTo: 6 })).ok).toBe(true);
    });

    it('chegaradagi soatlar (0 va 23) qabul qilinadi', () => {
      expect(assessApplication(validDraft({ workFrom: 0, workTo: 23 })).ok).toBe(true);
    });
  });

  describe('tumanlar', () => {
    it('boʻsh roʻyxat qabul qilinadi — tuman endi soʻralmaydi', () => {
      expect(assessApplication(validDraft({ districts: [] })).ok).toBe(true);
    });

    it('faqat boʻshliqdan iborat nom hisobga olinmaydi', () => {
      expect(assessApplication(validDraft({ districts: ['   '] })).ok).toBe(true);
    });

    it('takror rad etiladi — registr va boʻshliqqa qaramay', () => {
      const verdict = assessApplication(validDraft({ districts: ['Chilonzor', ' chilonzor '] }));

      expect(verdict.problems).toContain('Tumanlar roʻyxatida takror bor.');
    });

    it(`${MAX_DISTRICTS} tadan koʻp tuman rad etiladi`, () => {
      const districts = Array.from({ length: MAX_DISTRICTS + 1 }, (_, index) => `Tuman-${index}`);

      expect(assessApplication(validDraft({ districts })).ok).toBe(false);
    });
  });

  describe('«oʻzim haqimda»', () => {
    it(`${MIN_ABOUT_LENGTH} belgidan qisqa matn rad etiladi`, () => {
      expect(assessApplication(validDraft({ about: 'a'.repeat(MIN_ABOUT_LENGTH - 1) })).ok).toBe(
        false,
      );
    });

    it(`${MAX_ABOUT_LENGTH} belgidan uzun matn rad etiladi`, () => {
      expect(assessApplication(validDraft({ about: 'a'.repeat(MAX_ABOUT_LENGTH + 1) })).ok).toBe(
        false,
      );
    });

    it('uzunlik boʻshliqlarsiz sanaladi', () => {
      const padded = `   ${'a'.repeat(MIN_ABOUT_LENGTH - 1)}   `;

      expect(assessApplication(validDraft({ about: padded })).ok).toBe(false);
    });
  });

  describe('ism-familiya', () => {
    it('bitta soʻz rad etiladi — moderator hujjat bilan solishtiradi', () => {
      const verdict = assessApplication(validDraft({ fullName: 'Alisherbek' }));

      expect(verdict.ok).toBe(false);
      expect(verdict.problems[0]).toContain('Ism va familiyani');
    });
  });

  describe('soʻralgan xizmatlar', () => {
    it('boʻsh roʻyxat rad etiladi', () => {
      expect(assessApplication(validDraft({ requestedCategoryIds: [] })).ok).toBe(false);
    });

    it('takror identifikator rad etiladi', () => {
      const id = '11111111-1111-4111-8111-111111111111';

      expect(assessApplication(validDraft({ requestedCategoryIds: [id, id] })).ok).toBe(false);
    });

    it(`${MAX_REQUESTED_CATEGORIES} tadan koʻp xizmat rad etiladi`, () => {
      const ids = Array.from(
        { length: MAX_REQUESTED_CATEGORIES + 1 },
        (_, index) => `1111111${index}-1111-4111-8111-111111111111`,
      );

      expect(assessApplication(validDraft({ requestedCategoryIds: ids })).ok).toBe(false);
    });
  });
});

describe('normalizeDraft', () => {
  it('ortiqcha boʻshliqlarni olib tashlaydi va asl obyektga tegmaydi', () => {
    const draft = validDraft({ fullName: '  Alisher   Karimov ', districts: [' Chilonzor ', ' '] });
    const normalized = normalizeDraft(draft);

    expect(normalized.fullName).toBe('Alisher Karimov');
    expect(normalized.districts).toEqual(['Chilonzor']);
    expect(draft.districts).toEqual([' Chilonzor ', ' ']);
  });
});

/*
 * Santexnikaga oʻtishdan keyin roʻyxatdan oʻtish bitta ekranga tushdi:
 * ustadan faqat ism va xizmatlar soʻraladi. Quyidagi testlar aynan shu
 * qisqargan arizani himoya qiladi — kimdir maydonni yana majburiy qilib
 * qoʻysa, shu yerda yiqiladi.
 */
describe('qisqargan ariza', () => {
  const minimal: ApplicationDraft = {
    fullName: 'Alisher Karimov',
    requestedCategoryIds: ['11111111-1111-4111-8111-111111111111'],
  };

  it('faqat ism va xizmat bilan qabul qilinadi', () => {
    expect(assessApplication(minimal)).toEqual({ ok: true, problems: [] });
  });

  it('ismsiz yoki xizmatsiz baribir rad etiladi', () => {
    expect(assessApplication({ ...minimal, fullName: 'Ali' }).ok).toBe(false);
    expect(assessApplication({ ...minimal, requestedCategoryIds: [] }).ok).toBe(false);
  });

  it('boʻsh «oʻzim haqimda» xato emas, yarim yozilgani xato', () => {
    expect(assessApplication({ ...minimal, about: '' }).ok).toBe(true);
    expect(assessApplication({ ...minimal, about: 'qisqa' }).ok).toBe(false);
  });

  it('ish vaqtining faqat bir uchi berilsa — xato', () => {
    expect(assessApplication({ ...minimal, workFrom: 9 }).ok).toBe(false);
  });

  it('berilmagan maydon `undefined` boʻlib qoladi', () => {
    expect(normalizeDraft(minimal).about).toBeUndefined();
    expect(normalizeDraft(minimal).districts).toBeUndefined();
  });

  it('soʻralmagan maydon `null` boʻlib saqlanadi — toʻqilgan javob emas', () => {
    const stored = toStoredApplication(normalizeDraft(minimal));

    expect(stored.profession).toBeNull();
    expect(stored.about).toBeNull();
    expect(stored.workFrom).toBeNull();
    expect(stored.workTo).toBeNull();
    // Postgres massivi `null` boʻla olmaydi — boʻsh roʻyxat shu maʼnoda.
    expect(stored.districts).toEqual([]);
  });

  it('boʻsh satr ham «yozmadim» deb saqlanadi', () => {
    expect(toStoredApplication(normalizeDraft({ ...minimal, about: '   ' })).about).toBeNull();
  });
});
