import { NotFoundException } from '@nestjs/common';
import { ServicePageService } from './service-page.service';

const row = {
  id: 'c-1',
  steps: [{ title: 'Nam tozalash', description: 'Nam mato bilan' }],
  faq: [{ question: 'Qancha vaqt?', answer: '10 daqiqa' }],
  requirements: ['Suv oʻchirgich'],
  highlights: ['100+ soat oʻqitilgan usta'],
  warrantyNote: 'Zarar qoplanadi',
  warrantyAmount: 5_000_000,
  media: [
    { url: '/oldin.webp', role: 'BEFORE' as const, caption: null },
    { url: '/keyin.webp', role: 'AFTER' as const, caption: null },
    { url: '/mato.webp', role: 'EQUIPMENT' as const, caption: 'Mikrofiber matolar' },
    { url: '/galereya.webp', role: 'GALLERY' as const, caption: null },
  ],
};

const service = (found: unknown) =>
  new ServicePageService({ serviceCategory: { findFirst: () => Promise.resolve(found) } } as never);

describe('ServicePageService', () => {
  it('sahifa bloklarini yigʻadi', async () => {
    // Act
    const page = await service(row).read('c-1');

    // Assert
    expect(page.steps).toEqual([{ title: 'Nam tozalash', description: 'Nam mato bilan' }]);
    expect(page.faq).toHaveLength(1);
    expect(page.warranty).toEqual({ note: 'Zarar qoplanadi', amount: 5_000_000 });
    expect(page.beforeAfter).toEqual({ before: '/oldin.webp', after: '/keyin.webp' });
    expect(page.equipment).toEqual([{ url: '/mato.webp', caption: 'Mikrofiber matolar' }]);
  });

  /* Toʻldirilmagan blok ilovada UMUMAN chizilmasligi kerak. */
  it('toʻldirilmagan bloklar boʻsh qaytadi, toʻqilmaydi', async () => {
    const page = await service({
      ...row,
      steps: null,
      faq: null,
      requirements: [],
      highlights: [],
      warrantyNote: null,
      warrantyAmount: null,
      media: [],
    }).read('c-1');

    expect(page.steps).toEqual([]);
    expect(page.faq).toEqual([]);
    expect(page.warranty).toBeNull();
    expect(page.beforeAfter).toBeNull();
    expect(page.equipment).toEqual([]);
  });

  /* Oʻchirilgan xizmat mijozga koʻrinmaydi — `findFirst` uni topmaydi. */
  it('xizmat topilmasa 404', async () => {
    await expect(service(null).read('yoʻq')).rejects.toBeInstanceOf(NotFoundException);
  });
});
