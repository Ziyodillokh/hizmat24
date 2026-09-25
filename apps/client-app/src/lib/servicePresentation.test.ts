import { describe, expect, it } from 'vitest';
import type { ServiceCategory } from '@/mocks/types';
import {
  buildGallery,
  durationLabel,
  hasRichDetails,
  mediaSrc,
  priceLabel,
} from './servicePresentation';

const base = (extra: Partial<ServiceCategory> = {}): ServiceCategory => ({
  id: 'c1',
  name: 'Kran taʼmirlash',
  description: null,
  groupId: 'g1',
  basePrice: 120_000,
  ...extra,
});

describe('durationLabel', () => {
  it.each([
    [40, '40 daqiqa'],
    [60, '1 soat'],
    [90, '1 soat 30 daqiqa'],
    [125, '2 soat 5 daqiqa'],
  ])('%i daqiqa → %s', (minutes, expected) => {
    expect(durationLabel(minutes)).toBe(expected);
  });

  it.each([null, undefined, 0, -5])('%s → null — vaqt taxmin qilinmaydi', (value) => {
    expect(durationLabel(value as number | null)).toBeNull();
  });
});

describe('priceLabel', () => {
  it('aniq narx oʻzgarmaydi', () => {
    expect(priceLabel('120 000 soʻm', 'FIXED')).toBe('120 000 soʻm');
  });

  it('«shundan boshlab» qoʻshimchasi', () => {
    expect(priceLabel('120 000 soʻm', 'FROM')).toBe('120 000 soʻmdan');
  });

  it('turi berilmasa aniq narx deb qaraladi', () => {
    expect(priceLabel('120 000 soʻm', undefined)).toBe('120 000 soʻm');
  });
});

describe('buildGallery', () => {
  it('muqova birinchi turadi va IKKI marta chizilmaydi', () => {
    const gallery = buildGallery(
      base({
        coverUrl: '/media/a.webp',
        media: [
          { kind: 'IMAGE', url: '/media/b.webp' },
          { kind: 'IMAGE', url: '/media/a.webp' },
        ],
      }),
    );

    expect(gallery.items.map((item) => item.url)).toEqual(['/media/a.webp', '/media/b.webp']);
  });

  it('muqova boʻlmasa roʻyxat oʻz tartibida qoladi', () => {
    const gallery = buildGallery(base({ media: [{ kind: 'VIDEO', url: '/media/v.mp4' }] }));

    expect(gallery.cover).toBeNull();
    expect(gallery.items).toHaveLength(1);
  });

  it('media umuman boʻlmasa boʻsh', () => {
    expect(buildGallery(base())).toEqual({ cover: null, items: [] });
  });
});

describe('hasRichDetails', () => {
  it('hech narsa boʻlmasa false — sahifa ochilmaydi', () => {
    expect(hasRichDetails(base())).toBe(false);
  });

  it.each([
    ['tavsif', { details: 'Batafsil' }],
    ['kiradi', { includes: ['Ishchi kuchi'] }],
    ['kirmaydi', { excludes: ['Ehtiyot qism'] }],
    ['media', { media: [{ kind: 'IMAGE' as const, url: '/media/a.webp' }] }],
  ])('%s boʻlsa true', (_name, extra) => {
    expect(hasRichDetails(base(extra))).toBe(true);
  });

  it('boʻsh tavsif hisobga olinmaydi', () => {
    expect(hasRichDetails(base({ details: '   ' }))).toBe(false);
  });
});

describe('mediaSrc', () => {
  it('asos manzilni oldiga qoʻyadi', () => {
    expect(mediaSrc('https://hizmat24.uz', '/media/a.webp')).toBe('https://hizmat24.uz/media/a.webp');
  });

  it('asos boʻlmasa nisbiy yoʻl qoladi', () => {
    expect(mediaSrc(null, '/media/a.webp')).toBe('/media/a.webp');
  });
});

/*
 * Galereyada FAQAT umumiy rasmlar. «Oldin/keyin» va uskuna rasmlari
 * sahifada oʻz boʻlimida yorligʻi bilan chiziladi; galereyaga ham
 * tushsa, foydalanuvchi ularni kontekstsiz koʻrib chalgʻirdi.
 */
describe('buildGallery — rasm rollari', () => {
  const media = [
    { kind: 'IMAGE' as const, url: '/umumiy.webp', role: 'GALLERY' as const },
    { kind: 'IMAGE' as const, url: '/oldin.webp', role: 'BEFORE' as const },
    { kind: 'IMAGE' as const, url: '/keyin.webp', role: 'AFTER' as const },
    { kind: 'IMAGE' as const, url: '/mato.webp', role: 'EQUIPMENT' as const },
  ];

  it('oldin/keyin va uskuna rasmlari galereyaga tushmaydi', () => {
    const gallery = buildGallery({ media, coverUrl: null } as never);

    expect(gallery.items.map((item) => item.url)).toEqual(['/umumiy.webp']);
  });

  it('roli yoʻq rasm galereyada qoladi — eski server uni yubormaydi', () => {
    const gallery = buildGallery({
      media: [{ kind: 'IMAGE' as const, url: '/eski.webp' }],
      coverUrl: null,
    } as never);

    expect(gallery.items.map((item) => item.url)).toEqual(['/eski.webp']);
  });

  it('muqova galereyada bir marta, birinchi boʻlib turadi', () => {
    const gallery = buildGallery({ media, coverUrl: '/umumiy.webp' } as never);

    expect(gallery.items.map((item) => item.url)).toEqual(['/umumiy.webp']);
  });
});

/*
 * Kelajakda serverga yangi rol qoʻshilsa, eski ilova rasmni YOʻQOTMASLIGI
 * kerak. Shuning uchun filtr teskari: faqat maʼlum rollar chiqariladi.
 */
it('notanish rol galereyada qoladi', () => {
  const gallery = buildGallery({
    media: [{ kind: 'IMAGE' as const, url: '/yangi.webp', role: 'KELAJAK' as never }],
    coverUrl: null,
  } as never);

  expect(gallery.items.map((item) => item.url)).toEqual(['/yangi.webp']);
});
