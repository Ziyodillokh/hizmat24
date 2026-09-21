/**
 * Usta arizasining MAZMUNI boʻyicha qoidalar — sof mantiq: bazasiz,
 * tarmoqsiz, soatsiz.
 *
 * NEGA DTO dan alohida: `class-validator` har maydonni YAKKA holda
 * tekshiradi, bu yerdagi qoidalar esa maydonlar OʻRTASIDAGI bogʻliqlikka
 * tegishli — ish boshlanish va tugash soati bir xil boʻlmasligi, tumanlar
 * roʻyxatida takror boʻlmasligi. Bundan tashqari bir xil qoidalar keyin
 * ustaning oʻz profilini tahrirlashida ham kerak boʻladi (B4), shuning
 * uchun ular soʻrov shaklidan mustaqil turadi.
 */

/** Ish vaqti — mahalliy soat. Daqiqa soʻralmaydi. */
export const WORK_HOUR_MIN = 0;
export const WORK_HOUR_MAX = 23;

export const MIN_DISTRICTS = 1;
export const MAX_DISTRICTS = 12;
export const MIN_DISTRICT_LENGTH = 2;
export const MAX_DISTRICT_LENGTH = 80;

/**
 * «Oʻzim haqimda» eng kam uzunligi.
 *
 * NEGA 30: moderator qaror qabul qilishi kerak, «santexnikman» degan
 * uch soʻz esa hech narsa aytmaydi va arizani rad etishdan boshqa yoʻl
 * qoldirmaydi. Chegara odamga nima kutilayotganini oldindan aytadi.
 */
export const MIN_ABOUT_LENGTH = 30;
export const MAX_ABOUT_LENGTH = 1000;

export const MIN_FULL_NAME_LENGTH = 5;
export const MAX_FULL_NAME_LENGTH = 120;
export const MIN_PROFESSION_LENGTH = 3;
export const MAX_PROFESSION_LENGTH = 120;

export const MIN_REQUESTED_CATEGORIES = 1;
export const MAX_REQUESTED_CATEGORIES = 10;

export interface ApplicationDraft {
  readonly fullName: string;
  readonly profession: string;
  readonly about: string;
  readonly districts: readonly string[];
  readonly workFrom: number;
  readonly workTo: number;
  readonly requestedCategoryIds: readonly string[];
}

export interface ApplicationVerdict {
  readonly ok: boolean;
  /** Oʻzbekcha, aniq muammolar: har biri nima qilish kerakligini aytadi. */
  readonly problems: readonly string[];
}

/** Qoida buzilgan boʻlsa muammo matnini, aks holda `null` qaytaradi. */
type Rule = (draft: ApplicationDraft) => string | null;

const isWholeHour = (value: number): boolean =>
  Number.isInteger(value) && value >= WORK_HOUR_MIN && value <= WORK_HOUR_MAX;

/** Takrorni registr va boʻshliqqa qaramay topish uchun yagona koʻrinish. */
const canonical = (value: string): string => value.trim().normalize('NFKC').toLowerCase();

const countCharacters = (value: string): number => Array.from(value.trim()).length;

const checkFullName: Rule = ({ fullName }) => {
  const length = countCharacters(fullName);

  if (length < MIN_FULL_NAME_LENGTH || length > MAX_FULL_NAME_LENGTH) {
    return `Ism-familiya ${MIN_FULL_NAME_LENGTH}–${MAX_FULL_NAME_LENGTH} belgidan iborat boʻlsin.`;
  }

  // Moderator arizani hujjat bilan solishtiradi; bitta soʻz («Aziz») buni
  // imkonsiz qiladi, shuning uchun kamida ism va familiya soʻraladi.
  if (fullName.trim().split(/\s+/).length < 2) {
    return 'Ism va familiyani toʻliq yozing — moderator arizani hujjat bilan solishtiradi.';
  }

  return null;
};

const checkProfession: Rule = ({ profession }) => {
  const length = countCharacters(profession);
  if (length >= MIN_PROFESSION_LENGTH && length <= MAX_PROFESSION_LENGTH) return null;

  return `Kasb nomi ${MIN_PROFESSION_LENGTH}–${MAX_PROFESSION_LENGTH} belgidan iborat boʻlsin.`;
};

const checkAbout: Rule = ({ about }) => {
  const length = countCharacters(about);

  if (length < MIN_ABOUT_LENGTH) {
    return `«Oʻzim haqimda» kamida ${MIN_ABOUT_LENGTH} belgi boʻlsin — hozir ${length} ta.`;
  }
  if (length > MAX_ABOUT_LENGTH) {
    return `«Oʻzim haqimda» ${MAX_ABOUT_LENGTH} belgidan uzun boʻlmasin.`;
  }

  return null;
};

const checkWorkHours: Rule = ({ workFrom, workTo }) => {
  if (!isWholeHour(workFrom) || !isWholeHour(workTo)) {
    return `Ish vaqti ${WORK_HOUR_MIN} dan ${WORK_HOUR_MAX} gacha boʻlgan butun soat boʻlsin.`;
  }

  // Tenglik taqiqlangan: «09:00 dan 09:00 gacha» ham sutkalik smena, ham
  // nol uzunlikdagi smena deb oʻqilishi mumkin — ikki maʼnoli maʼlumot
  // panelga tushmasligi kerak. Teskari tartib (22 → 06) esa ATAYLAB
  // ruxsat etilgan: tungi smena haqiqiy holat.
  if (workFrom === workTo) {
    return 'Ish boshlanish va tugash soati bir xil boʻlmasin.';
  }

  return null;
};

const checkDistricts: Rule = ({ districts }) => {
  const cleaned = districts.map(canonical).filter((district) => district.length > 0);

  if (cleaned.length < MIN_DISTRICTS) {
    return 'Kamida bitta tumanni koʻrsating — buyurtma aynan shu boʻyicha yoʻnaltiriladi.';
  }
  if (cleaned.length > MAX_DISTRICTS) {
    return `Tumanlar soni ${MAX_DISTRICTS} tadan oshmasin.`;
  }
  if (new Set(cleaned).size !== cleaned.length) {
    return 'Tumanlar roʻyxatida takror bor.';
  }
  if (
    cleaned.some(
      (district) => district.length < MIN_DISTRICT_LENGTH || district.length > MAX_DISTRICT_LENGTH,
    )
  ) {
    return `Har bir tuman nomi ${MIN_DISTRICT_LENGTH}–${MAX_DISTRICT_LENGTH} belgidan iborat boʻlsin.`;
  }

  return null;
};

const checkRequestedCategories: Rule = ({ requestedCategoryIds }) => {
  if (requestedCategoryIds.length < MIN_REQUESTED_CATEGORIES) {
    return 'Kamida bitta xizmat turini tanlang.';
  }
  if (requestedCategoryIds.length > MAX_REQUESTED_CATEGORIES) {
    return `Bir arizada ${MAX_REQUESTED_CATEGORIES} tadan koʻp xizmat soʻralmaydi.`;
  }
  if (new Set(requestedCategoryIds).size !== requestedCategoryIds.length) {
    return 'Xizmat turlari roʻyxatida takror bor.';
  }

  return null;
};

const RULES: readonly Rule[] = [
  checkFullName,
  checkProfession,
  checkAbout,
  checkWorkHours,
  checkDistricts,
  checkRequestedCategories,
];

/**
 * Arizani baholaydi. Barcha qoidalar BIRDANIGA tekshiriladi: odam
 * muammolarni birma-bir topib, har safar qaytadan yubormasligi kerak.
 */
export function assessApplication(draft: ApplicationDraft): ApplicationVerdict {
  const problems = RULES.map((rule) => rule(draft)).filter(
    (problem): problem is string => problem !== null,
  );

  return { ok: problems.length === 0, problems };
}

/** Saqlashdan oldingi tozalash: ortiqcha boʻshliqlar va boʻsh tumanlar. */
export function normalizeDraft(draft: ApplicationDraft): ApplicationDraft {
  return {
    fullName: draft.fullName.trim().replace(/\s+/g, ' '),
    profession: draft.profession.trim(),
    about: draft.about.trim(),
    districts: draft.districts.map((district) => district.trim()).filter(Boolean),
    workFrom: draft.workFrom,
    workTo: draft.workTo,
    requestedCategoryIds: [...draft.requestedCategoryIds],
  };
}
