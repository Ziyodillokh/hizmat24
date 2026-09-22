import { describe, expect, it } from 'vitest';
import {
  ABOUT_MAX,
  ABOUT_MIN,
  aboutHint,
  buildApplicationMessage,
  EMPTY_MASTER_PROFILE,
  isMasterProfileValid,
  MASTER_PROFESSION,
  type MasterProfile,
} from './masterProfile';

/** Oʻzbek tipografiyasi: ASCII apostrof (U+0027) taqiqlanadi. */
const ASCII_APOSTROPHE = /'/;

const withAbout = (about: string): MasterProfile => ({ ...EMPTY_MASTER_PROFILE, about });

const FILLED = 'Oʻn yildan beri santexnika bilan shugʻullanaman, kran va quvurlar.';

describe('aboutHint', () => {
  /*
   * Eng muhim qoida: BOʻSH matn xato emas. Roʻyxatdan oʻtishda ustadan
   * majburiy hech narsa soʻralmaydi — bu test shuni qoʻriqlaydi.
   */
  it('boʻsh va faqat boʻshliqdan iborat matn — xato emas', () => {
    expect(aboutHint('')).toBeNull();
    expect(aboutHint('     ')).toBeNull();
  });

  it('yarim yozilgan matn eng kam uzunlikni aytadi', () => {
    const hint = aboutHint('a'.repeat(ABOUT_MIN - 1));
    expect(hint).toContain(String(ABOUT_MIN));
  });

  it('chegaradagi va toʻliq matn qabul qilinadi', () => {
    expect(aboutHint('a'.repeat(ABOUT_MIN))).toBeNull();
    expect(aboutHint(FILLED)).toBeNull();
  });

  it('chegaradan uzun matn rad etiladi', () => {
    expect(aboutHint('a'.repeat(ABOUT_MAX + 1))).toContain(String(ABOUT_MAX));
  });

  it('ishoralarda ASCII apostrof yoʻq', () => {
    for (const text of [aboutHint('qisqa'), aboutHint('a'.repeat(ABOUT_MAX + 1))]) {
      expect(ASCII_APOSTROPHE.test(text ?? '')).toBe(false);
    }
  });
});

describe('isMasterProfileValid', () => {
  it('boʻsh profil ham toʻgʻri profil — majburiy savol qolmadi', () => {
    expect(isMasterProfileValid(EMPTY_MASTER_PROFILE)).toBe(true);
  });

  it('faqat yarim yozilgan tanishtiruv toʻsadi', () => {
    expect(isMasterProfileValid(withAbout('qisqa'))).toBe(false);
    expect(isMasterProfileValid(withAbout(FILLED))).toBe(true);
  });
});

describe('MASTER_PROFESSION', () => {
  it('platformada yagona soha bor — u ustadan soʻralmaydi', () => {
    expect(MASTER_PROFESSION).toBe('Santexnik');
    expect(ASCII_APOSTROPHE.test(MASTER_PROFESSION)).toBe(false);
  });
});

describe('buildApplicationMessage', () => {
  const build = (about = FILLED, fullName: string | null = 'Dilshod') =>
    buildApplicationMessage({
      profile: withAbout(about),
      fullName,
      phoneNumber: '+998901234567',
    });

  it('kiritilgan maydonlar matnda', () => {
    const text = build();
    expect(text).toContain('Ism: Dilshod');
    expect(text).toContain('Telefon: +998 90 123 45 67');
    expect(text).toContain(`Soha: ${MASTER_PROFESSION}`);
    expect(text).toContain('Oʻn yildan beri');
  });

  it('soʻralmaydigan maydonlar matnda ham YOʻQ', () => {
    const text = build().toLowerCase();
    for (const word of ['tajriba', 'sertifikat', 'tuman', 'ish vaqti']) {
      expect(text).not.toContain(word);
    }
  });

  it('ism boʻlmasa qator umuman chizilmaydi', () => {
    expect(build(FILLED, null)).not.toContain('Ism:');
  });

  it('tanishtiruv boʻlmasa boʻlim umuman chizilmaydi', () => {
    expect(build('')).not.toContain('Oʻzim haqimda');
  });

  it('ariza raqami, holat yoki muddat YOʻQ', () => {
    const text = build().toLowerCase();
    for (const word of ['raqam', 'koʻrib chiqilmoqda', 'soat ichida', 'tasdiqlandi']) {
      expect(text).not.toContain(word);
    }
  });

  it('determinik — ikki chaqiruv bir xil matn beradi', () => {
    expect(build()).toBe(build());
  });

  it('ASCII apostrof yoʻq', () => {
    expect(ASCII_APOSTROPHE.test(build())).toBe(false);
  });
});
