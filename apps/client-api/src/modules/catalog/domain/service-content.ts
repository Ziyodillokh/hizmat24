/**
 * Xizmat sahifasining mazmuni — sof qoidalar.
 *
 * `steps` va `faq` bazada Json ustunida turadi. Json ustunga har qanday
 * narsa yozilgan boʻlishi mumkin: eski versiya, qoʻlda `psql`, buzilgan
 * import. Shuning uchun bazadan kelgan qiymatga HECH QACHON ishonilmaydi —
 * u shu yerda tekshirilib, faqat toʻgʻri shakldagi bandlar oʻtkaziladi.
 * Aks holda bitta buzuq yozuv butun xizmat sahifasini yiqitardi.
 */
import type { ServiceMediaRole } from '@prisma/client';

export const MAX_STEPS = 10;
export const MAX_FAQ = 12;
export const MAX_REQUIREMENTS = 10;
export const MAX_HIGHLIGHTS = 6;

export const STEP_TITLE_MAX = 80;
export const STEP_TEXT_MAX = 300;
export const FAQ_QUESTION_MAX = 200;
export const FAQ_ANSWER_MAX = 1000;
export const WARRANTY_NOTE_MAX = 300;

/** Qoplama chegarasi soʻmda. Narx bilan bir xil yuqori chegara. */
export const WARRANTY_AMOUNT_MAX = 100_000_000;

export interface ServiceStep {
  title: string;
  description: string;
}

export interface ServiceFaqItem {
  question: string;
  answer: string;
}

const text = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length === 0 || trimmed.length > max ? null : trimmed;
};

/**
 * Json ustunidan bosqichlar roʻyxati.
 *
 * Tavsif boʻsh boʻlishi mumkin (faqat sarlavha ham maʼnoli), lekin
 * sarlavhasiz band koʻrsatib boʻlmaydi — u tashlab yuboriladi.
 */
export function parseSteps(value: unknown): ServiceStep[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((item) => {
      if (typeof item !== 'object' || item === null) return [];

      const entry = item as Record<string, unknown>;
      const title = text(entry.title, STEP_TITLE_MAX);
      if (title === null) return [];

      return [{ title, description: text(entry.description, STEP_TEXT_MAX) ?? '' }];
    })
    .slice(0, MAX_STEPS);
}

/** Json ustunidan savol-javoblar. Javobsiz savol koʻrsatilmaydi. */
export function parseFaq(value: unknown): ServiceFaqItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((item) => {
      if (typeof item !== 'object' || item === null) return [];

      const entry = item as Record<string, unknown>;
      const question = text(entry.question, FAQ_QUESTION_MAX);
      const answer = text(entry.answer, FAQ_ANSWER_MAX);
      if (question === null || answer === null) return [];

      return [{ question, answer }];
    })
    .slice(0, MAX_FAQ);
}

/**
 * Kafolat bloki koʻrsatiladimi.
 *
 * Izoh va summa BIRGA boʻlgandagina maʼnoli: summasiz «zarar qoplanadi»
 * va izohsiz quruq raqam — ikkalasi ham mijozni chalgʻitadi.
 */
export function hasWarranty(note: string | null, amount: number | null): boolean {
  return note !== null && note.trim().length > 0 && amount !== null && amount > 0;
}

/** Sahifadagi rasm — rol boʻyicha saralash uchun kerakli minimal shakl. */
export interface PageMedia {
  url: string;
  role: ServiceMediaRole;
  caption: string | null;
}

/**
 * «Oldin / keyin» solishtiruvchi juftlik.
 *
 * Faqat IKKALASI ham boʻlsa qaytariladi: yolgʻiz «oldin» rasmi hech
 * narsani koʻrsatmaydi va ekranda yarim buzuq solishtirgich chizardi.
 */
export function beforeAfterPair(media: readonly PageMedia[]): { before: string; after: string } | null {
  const before = media.find((item) => item.role === 'BEFORE');
  const after = media.find((item) => item.role === 'AFTER');

  return before && after ? { before: before.url, after: after.url } : null;
}

/** «Bizning uskunalarimiz» tasmasi — tartib media tartibidan keladi. */
export const equipmentItems = (media: readonly PageMedia[]): PageMedia[] =>
  media.filter((item) => item.role === 'EQUIPMENT');
