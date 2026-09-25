import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import {
  beforeAfterPair,
  equipmentItems,
  hasWarranty,
  parseFaq,
  parseSteps,
  type ServiceFaqItem,
  type ServiceStep,
} from './domain/service-content';

/**
 * Xizmat sahifasining «ogʻir» qismi — roʻyxatga tushmaydigan bloklar.
 *
 * Roʻyxat (`/service-categories`) ilova ochilganda bir marta olinadi va
 * keshlanadi. Jarayon bosqichlari, FAQ va uskunalar HAR BIR xizmat uchun
 * oʻsha javobga qoʻshilsa, roʻyxat bir necha barobar ogʻirlashardi —
 * holbuki ular faqat bitta xizmat ochilganda kerak.
 *
 * Shuning uchun karta maydonlari roʻyxatdan, qolgani shu yerdan keladi:
 * sahifaning tepasi darhol chiziladi, bloklar esa yuklangach qoʻshiladi.
 */
export interface ServicePageView {
  id: string;
  /** «Bizning jarayonimiz» bosqichlari. Boʻsh boʻlsa blok chizilmaydi. */
  steps: ServiceStep[];
  faq: ServiceFaqItem[];
  /** «Sizdan bizga nima kerak boʻladi». */
  requirements: string[];
  /** Ishonch bandlari. */
  highlights: string[];
  /** Izoh va summa BIRGA boʻlgandagina toʻldiriladi. */
  warranty: { note: string; amount: number } | null;
  /** «Oldin / keyin» juftligi; ikkala rasm ham boʻlsa. */
  beforeAfter: { before: string; after: string } | null;
  equipment: { url: string; caption: string | null }[];
}

@Injectable()
export class ServicePageService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bitta xizmat sahifasining mazmuni.
   *
   * ATAYLAB keshlanmaydi: bu bitta qator va u faqat xizmat ochilganda
   * oʻqiladi. Kesh bu yerda tezlik bermaydi, lekin admin oʻzgartirgan
   * matn bir necha daqiqa eski koʻrinib turardi.
   */
  async read(id: string): Promise<ServicePageView> {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        steps: true,
        faq: true,
        requirements: true,
        highlights: true,
        warrantyNote: true,
        warrantyAmount: true,
        media: {
          orderBy: { sortOrder: 'asc' },
          select: { url: true, role: true, caption: true },
        },
      },
    });

    if (!category) throw new NotFoundException('Xizmat topilmadi.');

    return {
      id: category.id,
      steps: parseSteps(category.steps),
      faq: parseFaq(category.faq),
      requirements: category.requirements,
      highlights: category.highlights,
      warranty: hasWarranty(category.warrantyNote, category.warrantyAmount)
        ? { note: category.warrantyNote as string, amount: category.warrantyAmount as number }
        : null,
      beforeAfter: beforeAfterPair(category.media),
      equipment: equipmentItems(category.media).map((item) => ({
        url: item.url,
        caption: item.caption,
      })),
    };
  }
}
