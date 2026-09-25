import { describe, expect, it } from 'vitest';
import { hasContent, type ServicePage } from './servicePage';

const empty: ServicePage = {
  id: 'c-1',
  steps: [],
  faq: [],
  requirements: [],
  highlights: [],
  warranty: null,
  beforeAfter: null,
  equipment: [],
};

describe('hasContent', () => {
  /*
   * Toʻldirilmagan xizmatda sahifa bloklari UMUMAN chizilmasligi kerak —
   * boʻsh sarlavhalar sahifani uzaytiradi va hech narsa bermaydi.
   */
  it('hech narsa toʻldirilmagan boʻlsa false', () => {
    expect(hasContent(empty)).toBe(false);
  });

  it('bitta blok toʻldirilsa ham true', () => {
    expect(hasContent({ ...empty, steps: [{ title: 'Nam tozalash', description: '' }] })).toBe(true);
    expect(hasContent({ ...empty, faq: [{ question: 'Savol?', answer: 'Javob' }] })).toBe(true);
    expect(hasContent({ ...empty, requirements: ['Suv oʻchirgich'] })).toBe(true);
    expect(hasContent({ ...empty, highlights: ['Oʻqitilgan usta'] })).toBe(true);
    expect(hasContent({ ...empty, equipment: [{ url: '/a.webp', caption: null }] })).toBe(true);
    expect(hasContent({ ...empty, warranty: { note: 'Qoplanadi', amount: 5_000_000 } })).toBe(true);
    expect(hasContent({ ...empty, beforeAfter: { before: '/a.webp', after: '/b.webp' } })).toBe(true);
  });
});
