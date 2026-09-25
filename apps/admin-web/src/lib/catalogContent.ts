/**
 * Xizmat sahifasining MAZMUN bloklari — sof mantiq.
 *
 * Asosiy shakldan (`catalogForm.ts`) ataylab ajratilgan: bu yerda oltita
 * mustaqil blok bor va ikkalasi bitta faylda boʻlganda fayl oʻqib
 * boʻlmas darajada uzayardi.
 *
 * Chegaralar server bilan BIR XIL (`service-content.ts`): panel sababni
 * tugmani bosishdan oldin aytadi, server esa baribir oʻzi tekshiradi.
 */
import type { CategoryContentInput, ServiceFaqItem, ServiceStep } from '@/api/admin';

export const MAX_STEPS = 10;
export const MAX_FAQ = 12;
export const MAX_REQUIREMENTS = 10;
export const MAX_HIGHLIGHTS = 6;

export const STEP_TITLE_MAX = 80;
export const STEP_TEXT_MAX = 300;
export const FAQ_QUESTION_MAX = 200;
export const FAQ_ANSWER_MAX = 1000;
export const WARRANTY_NOTE_MAX = 300;
export const WARRANTY_AMOUNT_MAX = 100_000_000;

export interface ContentFormState {
  steps: ServiceStep[];
  faq: ServiceFaqItem[];
  requirements: string[];
  highlights: string[];
  warrantyNote: string;
  /** Matn sifatida: foydalanuvchi yozayotganda boʻsh boʻlishi mumkin. */
  warrantyAmount: string;
}

export const EMPTY_CONTENT: ContentFormState = {
  steps: [],
  faq: [],
  requirements: [],
  highlights: [],
  warrantyNote: '',
  warrantyAmount: '',
};

export const EMPTY_STEP: ServiceStep = { title: '', description: '' };
export const EMPTY_FAQ: ServiceFaqItem = { question: '', answer: '' };

const isBlank = (value: string): boolean => value.trim().length === 0;

/** Ikkala maydoni ham boʻsh qator — admin qoʻshib, toʻldirmagan. */
const isEmptyStep = (step: ServiceStep): boolean =>
  isBlank(step.title) && isBlank(step.description);

const isEmptyFaq = (item: ServiceFaqItem): boolean =>
  isBlank(item.question) && isBlank(item.answer);

/**
 * Yarim toʻldirilgan qator — XATO, jimgina tashlanmaydi.
 *
 * Butunlay boʻsh qator tashlanadi (admin qoʻshib, fikridan qaytgan),
 * lekin yozilgan matnni jimgina yoʻqotish — eng yomon xatti-harakat.
 */
function stepProblems(steps: readonly ServiceStep[]): string[] {
  const problems: string[] = [];
  const filled = steps.filter((step) => !isEmptyStep(step));

  if (filled.length > MAX_STEPS) problems.push(`Bosqichlar ${MAX_STEPS} tadan koʻp boʻlmasin.`);
  if (filled.some((step) => isBlank(step.title))) {
    problems.push('Har bir bosqichning sarlavhasi boʻlsin.');
  }
  if (filled.some((step) => step.title.trim().length > STEP_TITLE_MAX)) {
    problems.push(`Bosqich sarlavhasi ${STEP_TITLE_MAX} belgidan uzun boʻlmasin.`);
  }
  if (filled.some((step) => step.description.trim().length > STEP_TEXT_MAX)) {
    problems.push(`Bosqich tavsifi ${STEP_TEXT_MAX} belgidan uzun boʻlmasin.`);
  }

  return problems;
}

function faqProblems(faq: readonly ServiceFaqItem[]): string[] {
  const problems: string[] = [];
  const filled = faq.filter((item) => !isEmptyFaq(item));

  if (filled.length > MAX_FAQ) problems.push(`Savollar ${MAX_FAQ} tadan koʻp boʻlmasin.`);
  if (filled.some((item) => isBlank(item.question) || isBlank(item.answer))) {
    problems.push('Har bir savolning javobi boʻlsin.');
  }
  if (filled.some((item) => item.question.trim().length > FAQ_QUESTION_MAX)) {
    problems.push(`Savol ${FAQ_QUESTION_MAX} belgidan uzun boʻlmasin.`);
  }
  if (filled.some((item) => item.answer.trim().length > FAQ_ANSWER_MAX)) {
    problems.push(`Javob ${FAQ_ANSWER_MAX} belgidan uzun boʻlmasin.`);
  }

  return problems;
}

/**
 * Kafolat — izoh va summa BIRGA.
 *
 * Summasiz «zarar qoplanadi» ham, izohsiz quruq raqam ham mijozni
 * chalgʻitadi, shuning uchun yarimtasi xato deb hisoblanadi.
 */
function warrantyProblems(form: ContentFormState, amount: number | null): string[] {
  const hasNote = !isBlank(form.warrantyNote);
  const hasAmount = !isBlank(form.warrantyAmount);

  if (!hasNote && !hasAmount) return [];
  if (!hasNote) return ['Qoplama summasi bilan birga izoh ham yozilsin.'];
  if (!hasAmount) return ['Qoplama izohi bilan birga summa ham yozilsin.'];

  if (amount === null || amount <= 0) return ['Qoplama summasi butun musbat son boʻlsin.'];
  if (amount > WARRANTY_AMOUNT_MAX) return ['Qoplama summasi juda katta.'];
  if (form.warrantyNote.trim().length > WARRANTY_NOTE_MAX) {
    return [`Qoplama izohi ${WARRANTY_NOTE_MAX} belgidan uzun boʻlmasin.`];
  }

  return [];
}

function listProblems(label: string, list: readonly string[], max: number, itemMax: number): string[] {
  const filled = list.filter((item) => !isBlank(item));
  const problems: string[] = [];

  if (filled.length > max) problems.push(`${label} ${max} tadan koʻp boʻlmasin.`);
  if (filled.some((item) => item.trim().length > itemMax)) {
    problems.push(`${label} bandi ${itemMax} belgidan uzun boʻlmasin.`);
  }

  return problems;
}

/** Barcha muammolar BIRDANIGA — admin ularni birma-bir topmasin. */
export function validateContent(form: ContentFormState, amount: number | null): string[] {
  return [
    ...stepProblems(form.steps),
    ...faqProblems(form.faq),
    ...listProblems('«Sizdan nima kerak» bandlari', form.requirements, MAX_REQUIREMENTS, 200),
    ...listProblems('Ishonch bandlari', form.highlights, MAX_HIGHLIGHTS, 120),
    ...warrantyProblems(form, amount),
  ];
}

/**
 * Shakl → serverga yuboriladigan mazmun.
 *
 * Har bir maydon DOIM yuboriladi — hatto boʻsh boʻlsa ham. Server PATCH ni
 * qisman qiladi (`if (dto.X !== undefined)`), shuning uchun tushirib
 * qoldirilgan maydon «oʻzgarmasin» degani boʻladi va admin blokni
 * TOZALAY olmay qolardi.
 */
export function toContentInput(form: ContentFormState, amount: number | null): CategoryContentInput {
  const clean = (list: readonly string[]) => list.map((item) => item.trim()).filter(Boolean);

  return {
    steps: form.steps
      .filter((step) => !isEmptyStep(step))
      .map((step) => ({ title: step.title.trim(), description: step.description.trim() })),
    faq: form.faq
      .filter((item) => !isEmptyFaq(item))
      .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() })),
    requirements: clean(form.requirements),
    highlights: clean(form.highlights),
    warrantyNote: form.warrantyNote.trim(),
    warrantyAmount: isBlank(form.warrantyNote) ? 0 : (amount ?? 0),
  };
}
