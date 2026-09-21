import {
  LEAKED_PASSWORDS,
  MIN_PASSWORD_LENGTH,
  assessPassword,
  generatePassword,
} from './password-policy';

const EMAIL = 'admin@hizmat24.uz';
/** Hech bir qoidani buzmaydigan tayanch qiymat — testlar undan chetlanadi. */
const STRONG = 'Qxvt7-Rmzk4-Hbnp9';

const assess = (password: string, email = EMAIL) => assessPassword(password, { email });

describe('assessPassword', () => {
  it('barcha qoidadan oʻtgan parolni qabul qiladi', () => {
    expect(assess(STRONG)).toEqual({ ok: true, problems: [] });
  });

  describe('uzunlik', () => {
    it(`${MIN_PASSWORD_LENGTH} belgidan qisqa parolni rad etadi`, () => {
      const verdict = assess('Qxvt7-Rmzk');

      expect(verdict.ok).toBe(false);
      expect(verdict.problems).toContainEqual(expect.stringContaining('kamida 12 belgidan'));
    });

    it('aniq chegaradagi uzunlikni qabul qiladi', () => {
      expect(assess('Qxvt7-Rmzk4').ok).toBe(false);
      expect(assess('Qxvt7-Rmzk49').ok).toBe(true);
    });

    it('belgilarni sanaydi, baytlarni emas', () => {
      // 12 ta emoji — UTF-16 da 24 ta birlik. Surrogat juftlik yarimta
      // boʻlib sanalsa, qisqa parol uzun koʻrinib oʻtib ketardi.
      expect(assess('🙂'.repeat(11)).problems).toContainEqual(
        expect.stringContaining('hozir 11 ta'),
      );
    });
  });

  describe('sizib chiqqan parollar', () => {
    it.each(LEAKED_PASSWORDS)('"%s" ni rad etadi', (leaked) => {
      const verdict = assess(leaked);

      expect(verdict.ok).toBe(false);
      expect(verdict.problems).toContainEqual(expect.stringContaining('ochiq manbada koʻringan'));
    });

    it.each(LEAKED_PASSWORDS)('"%s" ni registri oʻzgartirilgan holda ham rad etadi', (leaked) => {
      expect(assess(leaked.toLowerCase()).ok).toBe(false);
      expect(assess(leaked.toUpperCase()).ok).toBe(false);
    });

    it('Unicode bilan yashirilgan variantni ham rad etadi', () => {
      // Toʻliq kenglikdagi lotin harflari boshqacha kodlanadi, lekin NFKC
      // dan keyin oddiy harflarga aylanadi — shu bilan aylanib oʻtib
      // boʻlmasligi kerak.
      const fullWidth = 'Ｊｕｄａ-Ｋｕｃｈｌｉ-Ｐａｒｏｌ-２０２６';

      expect(fullWidth).not.toBe('Juda-Kuchli-Parol-2026');
      expect(assess(fullWidth).ok).toBe(false);
    });

    it('test fiksturasi hech qachon haqiqiy parol boʻla olmaydi', () => {
      // Fikstura qiymati testda ochiq yozilgan — demak u ommaviy.
      expect(LEAKED_PASSWORDS).toContain('test-fikstura-parol-ishlatilmaydi');
      expect(assess('test-fikstura-parol-ishlatilmaydi').ok).toBe(false);
    });
  });

  describe('email nomi', () => {
    it('email nomini oʻz ichiga olgan parolni rad etadi', () => {
      const verdict = assess('Qxvt-admin-Rmzk4');

      expect(verdict.ok).toBe(false);
      expect(verdict.problems).toContainEqual(expect.stringContaining('email nomi ("admin")'));
    });

    it('registrdan qatʼi nazar topadi', () => {
      expect(assess('Qxvt-ADMIN-Rmzk4').ok).toBe(false);
    });

    it('juda qisqa email nomini eʼtiborsiz qoldiradi', () => {
      // "a@x.uz" nomi bitta harf — u deyarli har qanday parolda bor va
      // tekshiruv butun siyosatni foydasiz qilib qoʻyardi.
      expect(assess(STRONG, 'a@x.uz').ok).toBe(true);
    });

    it('boʻsh email bilan ham qulamaydi', () => {
      expect(assess(STRONG, '').ok).toBe(true);
    });
  });

  describe('naqshlar', () => {
    it('bitta belgi takroridan iborat parolni rad etadi', () => {
      const verdict = assess('aaaaaaaaaaaaaaaa');

      expect(verdict.ok).toBe(false);
      expect(verdict.problems).toContainEqual(expect.stringContaining('bitta belgining takrori'));
    });

    it.each([
      ['raqamlar oʻsib boradi', 'Qxvt-12345678-Rm'],
      ['harflar oʻsib boradi', 'Qxvt-abcdefgh-Rm'],
      ['kamayib boradi', 'Qxvt-87654321-Rm'],
      ['katta harflar bilan', 'Qxvt-ABCDEFGH-Rm'],
    ])('ketma-ket belgilarni rad etadi (%s)', (_name, password) => {
      const verdict = assess(password);

      expect(verdict.ok).toBe(false);
      expect(verdict.problems).toContainEqual(expect.stringContaining('ketma-ket belgi'));
    });

    it('qisqa ketma-ketlikka tegmaydi', () => {
      // "vwx" uchta — oddiy soʻzlarda ham uchraydi, rad etilsa siyosat
      // foydalanuvchini bezovta qilib, zaifroq parolga undardi.
      expect(assess('Qvwx7-Rmzk4-Hbnp9').ok).toBe(true);
    });
  });

  it('bir nechta muammoni BIRDANIGA qaytaradi', () => {
    // Foydalanuvchi xatolarni birma-bir topib, har safar qaytadan
    // urinmasligi kerak.
    const verdict = assess('admin123');

    expect(verdict.ok).toBe(false);
    expect(verdict.problems.length).toBeGreaterThanOrEqual(2);
  });
});

describe('generatePassword', () => {
  it('siyosatdan oʻtadigan parol beradi', () => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      expect(assess(generatePassword()).ok).toBe(true);
    }
  });

  it('har safar boshqa parol beradi', () => {
    const generated = new Set(Array.from({ length: 50 }, generatePassword));

    expect(generated.size).toBe(50);
  });

  it('guruhlarga boʻlingan va chalkashtiradigan belgilarsiz', () => {
    const password = generatePassword();

    expect(password).toMatch(/^[A-Za-z2-9]{5}(-[A-Za-z2-9]{5}){3}$/);
    expect(password).not.toMatch(/[0O1lI]/);
  });
});
