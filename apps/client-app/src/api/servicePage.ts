import { apiRequest } from './client';

/**
 * Xizmat sahifasining «ogʻir» bloklari — roʻyxatga tushmaydiganlari.
 *
 * Karta maydonlari (nom, narx, davomiylik, muqova) katalog roʻyxatidan
 * keladi va sahifa tepasi darhol chiziladi. Bu bloklar esa faqat xizmat
 * ochilganda soʻraladi: ular har bir xizmat uchun roʻyxatga qoʻshilsa,
 * ilova ochilishidagi soʻrov bir necha barobar ogʻirlashardi.
 */
export interface ServiceStep {
  title: string;
  description: string;
}

export interface ServiceFaqItem {
  question: string;
  answer: string;
}

export interface ServicePage {
  id: string;
  steps: ServiceStep[];
  faq: ServiceFaqItem[];
  requirements: string[];
  highlights: string[];
  warranty: { note: string; amount: number } | null;
  beforeAfter: { before: string; after: string } | null;
  equipment: { url: string; caption: string | null }[];
}

/** Sahifada koʻrsatiladigan biror narsa bormi. */
export const hasContent = (page: ServicePage): boolean =>
  page.steps.length > 0 ||
  page.faq.length > 0 ||
  page.requirements.length > 0 ||
  page.highlights.length > 0 ||
  page.equipment.length > 0 ||
  page.warranty !== null ||
  page.beforeAfter !== null;

export const fetchServicePage = (categoryId: string): Promise<ServicePage> =>
  apiRequest(`/api/v1/service-categories/${categoryId}/page`);
