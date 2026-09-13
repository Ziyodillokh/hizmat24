import { describe, expect, it } from 'vitest';
import {
  ABOUT_MIN,
  buildApplicationMessage,
  canContinueSetupStep,
  completedStepCount,
  DISTRICTS_MAX,
  EMPTY_MASTER_PROFILE,
  EXPERIENCE_LABELS,
  EXPERIENCE_LEVELS,
  firstIncompleteStep,
  formatHour,
  formatWorkHours,
  isMasterProfileComplete,
  MASTER_PROFESSIONS,
  parseSetupStep,
  REQUIRED_STEP_COUNT,
  SETUP_STEP_LABELS,
  SETUP_STEPS,
  setupStepHint,
  setupStepIndex,
  TASHKENT_DISTRICTS,
  toggleDistrict,
  type MasterProfile,
} from './masterProfile';
import { MASTER_LIST } from '@/mocks/masters';

/** Oʻzbek tipografiyasi: ASCII apostrof (U+0027) taqiqlanadi. */
const ASCII_APOSTROPHE = /'/;

function complete(extra: Partial<MasterProfile> = {}): MasterProfile {
  return {
    ...EMPTY_MASTER_PROFILE,
    profession: 'Santexnik',
    experienceLevel: 'EXPERIENCED',
    about: 'Oʻn yildan beri santexnika bilan shugʻullanaman, kran va quvurlar.',
    districts: ['Chilonzor', 'Yunusobod'],
    ...extra,
  };
}

describe('lugʻatlar', () => {
  it('katalogdagi har bir usta sohasi roʻyxatda bor — ikki tomon bir tilda', () => {
    for (const master of MASTER_LIST) expect(MASTER_PROFESSIONS).toContain(master.profession);
  });

  it('sohalar va tumanlar takrorlanmaydi', () => {
    expect(new Set(MASTER_PROFESSIONS).size).toBe(MASTER_PROFESSIONS.length);
    expect(new Set(TASHKENT_DISTRICTS).size).toBe(TASHKENT_DISTRICTS.length);
  });

  it('ASCII apostrof yoʻq', () => {
    const strings = [
      ...MASTER_PROFESSIONS,
      ...TASHKENT_DISTRICTS,
      ...Object.values(SETUP_STEP_LABELS),
      ...Object.values(EXPERIENCE_LABELS),
    ];
    for (const item of strings) expect(ASCII_APOSTROPHE.test(item)).toBe(false);
  });

  it('har bir tajriba darajasi uchun yorliq bor', () => {
    for (const level of EXPERIENCE_LEVELS) expect(EXPERIENCE_LABELS[level].length).toBeGreaterThan(0);
  });
});

describe('formatHour / formatWorkHours', () => {
  it('soatni ikki xonali qiladi', () => {
    expect(formatHour(9)).toBe('09:00');
    expect(formatHour(18)).toBe('18:00');
  });

  it('ish vaqti oraliq sifatida yoziladi', () => {
    expect(formatWorkHours({ workFrom: 9, workTo: 18 })).toBe('09:00 — 18:00');
  });
});

describe('parseSetupStep / setupStepIndex', () => {
  it('toʻgʻri qadamni qaytaradi', () => {
    expect(parseSetupStep('area')).toBe('area');
    expect(setupStepIndex('area')).toBe(3);
  });

  it('notoʻgʻri yoki boʻsh satrda birinchi qadam', () => {
    expect(parseSetupStep(null)).toBe('profession');
    expect(parseSetupStep('yoq')).toBe('profession');
  });
});

describe('setupStepHint', () => {
  it('boʻsh profilda har bir majburiy qadam sabab beradi', () => {
    for (const step of SETUP_STEPS) {
      if (step === 'review') continue;
      expect(setupStepHint(step, EMPTY_MASTER_PROFILE)).not.toBeNull();
    }
  });

  it('toʻliq profilda hech qaysi qadam toʻsmaydi', () => {
    for (const step of SETUP_STEPS) expect(setupStepHint(step, complete())).toBeNull();
  });

  it('qisqa "oʻzim haqimda" eng kam uzunlikni aytadi', () => {
    const hint = setupStepHint('about', complete({ about: 'a'.repeat(ABOUT_MIN - 1) }));
    expect(hint).toContain(String(ABOUT_MIN));
  });

  it('faqat boʻshliqdan iborat matn boʻsh hisoblanadi', () => {
    expect(setupStepHint('about', complete({ about: '     ' }))).toBe('Oʻzingiz haqingizda yozing');
  });

  it('ish tugashi boshlanishidan oldin boʻlsa oʻtkazmaydi', () => {
    expect(setupStepHint('area', complete({ workFrom: 18, workTo: 9 }))).not.toBeNull();
    expect(setupStepHint('area', complete({ workFrom: 9, workTo: 9 }))).not.toBeNull();
  });

  it('tekshirish qadami avvalgilar toʻliq boʻlgandagina ochiq', () => {
    expect(setupStepHint('review', complete({ profession: null }))).not.toBeNull();
    expect(canContinueSetupStep('review', complete())).toBe(true);
  });

  it('ishoralarda ASCII apostrof yoʻq', () => {
    const hints = SETUP_STEPS.map((step) => setupStepHint(step, EMPTY_MASTER_PROFILE) ?? '');
    for (const hint of hints) expect(ASCII_APOSTROPHE.test(hint)).toBe(false);
  });
});

describe('isMasterProfileComplete / firstIncompleteStep / completedStepCount', () => {
  it('boʻsh profil toʻliq emas va birinchi qadamdan boshlanadi', () => {
    expect(isMasterProfileComplete(EMPTY_MASTER_PROFILE)).toBe(false);
    expect(firstIncompleteStep(EMPTY_MASTER_PROFILE)).toBe('profession');
    expect(completedStepCount(EMPTY_MASTER_PROFILE)).toBe(0);
  });

  it('oʻrtada toʻxtagan profil oʻsha qadamga qaytadi', () => {
    const half = complete({ about: '', districts: [] });
    expect(firstIncompleteStep(half)).toBe('about');
    expect(completedStepCount(half)).toBe(2);
  });

  it('toʻliq profilda tekshirish qadami', () => {
    expect(isMasterProfileComplete(complete())).toBe(true);
    expect(firstIncompleteStep(complete())).toBe('review');
    expect(completedStepCount(complete())).toBe(REQUIRED_STEP_COUNT);
  });
});

describe('toggleDistrict', () => {
  it('qoʻshadi va olib tashlaydi, kirish massivini oʻzgartirmaydi', () => {
    const list = ['Chilonzor'];
    expect(toggleDistrict(list, 'Sergeli')).toEqual(['Chilonzor', 'Sergeli']);
    expect(toggleDistrict(list, 'Chilonzor')).toEqual([]);
    expect(list).toEqual(['Chilonzor']);
  });

  it('chegaraga yetganda yangisini qoʻshmaydi, lekin olib tashlashga ruxsat beradi', () => {
    const full = TASHKENT_DISTRICTS.slice(0, DISTRICTS_MAX);
    expect(toggleDistrict(full, TASHKENT_DISTRICTS[DISTRICTS_MAX])).toEqual(full);
    expect(toggleDistrict(full, full[0])).toHaveLength(DISTRICTS_MAX - 1);
  });
});

describe('buildApplicationMessage', () => {
  const build = (extra: Partial<MasterProfile> = {}, fullName: string | null = 'Dilshod') =>
    buildApplicationMessage({ profile: complete(extra), fullName, phoneNumber: '+998901234567' });

  it('barcha kiritilgan maydonlar matnda', () => {
    const text = build();
    expect(text).toContain('Ism: Dilshod');
    expect(text).toContain('Telefon: +998 90 123 45 67');
    expect(text).toContain('Soha: Santexnik');
    expect(text).toContain('Tajriba: Tajribam bor');
    expect(text).toContain('Tumanlar: Chilonzor, Yunusobod');
    expect(text).toContain('Ish vaqti: 09:00 — 18:00');
    expect(text).toContain('Oʻn yildan beri');
  });

  it('sertifikat daʼvosi "oʻzim aytdim" deb belgilanadi — tasdiq sifatida emas', () => {
    expect(build({ claimsCertificate: true })).toContain('hali tekshirilmagan');
    expect(build({ claimsCertificate: false })).toContain('Davlat sertifikati: yoʻq');
  });

  it('ism boʻlmasa qator umuman chizilmaydi', () => {
    expect(build({}, null)).not.toContain('Ism:');
  });

  it('ariza raqami, holat yoki muddat YOʻQ', () => {
    const text = build();
    for (const word of ['raqam', 'koʻrib chiqilmoqda', 'soat ichida', 'tasdiqlandi']) {
      expect(text.toLowerCase()).not.toContain(word);
    }
  });

  it('determinik — ikki chaqiruv bir xil matn beradi', () => {
    expect(build()).toBe(build());
  });

  it('ASCII apostrof yoʻq', () => {
    expect(ASCII_APOSTROPHE.test(build({ claimsCertificate: true }))).toBe(false);
  });
});
