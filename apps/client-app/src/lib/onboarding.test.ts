import { describe, expect, it } from 'vitest';
import {
  NEXT_LABEL,
  ONBOARDING_SLIDES,
  ONBOARDING_STEPS,
  ROLE_STEP_HINT,
  ROLE_STEP_TITLE,
  SKIP_LABEL,
} from './onboarding';

describe('ONBOARDING_SLIDES', () => {
  it('toʻrtta slayd va beshta qadam', () => {
    expect(ONBOARDING_SLIDES).toHaveLength(4);
    expect(ONBOARDING_STEPS).toBe(5);
  });

  /*
   * Platforma faqat santexnikaga xizmat qiladi va faqat bitta shaharda.
   * Ikkalasi ham BIRINCHI slaydda aytiladi: mijoz buyurtma berishdan
   * oldin bilishi kerak, tasdiqlash bosilgandan keyin emas.
   */
  it('birinchi slayd soha va shaharni ochiq aytadi', () => {
    const first = ONBOARDING_SLIDES[0];
    const text = `${first.title} ${first.description} ${first.caveat ?? ''}`.toLowerCase();

    expect(text).toContain('santexnika');
    expect(text).toContain('namangan');
  });

  it('tajriba darajasi haqida gap YOʻQ — u ustadan soʻralmaydi', () => {
    const texts = ONBOARDING_SLIDES.flatMap((s) => [s.title, s.description, s.caveat ?? '']);
    texts.forEach((text) => expect(text.toLowerCase()).not.toContain('tajriba'));
  });

  it('har bir slaydning kaliti va rasmi yagona', () => {
    expect(new Set(ONBOARDING_SLIDES.map((s) => s.id)).size).toBe(ONBOARDING_SLIDES.length);
    expect(new Set(ONBOARDING_SLIDES.map((s) => s.imageKey)).size).toBe(ONBOARDING_SLIDES.length);
  });

  it('sarlavha qisqa, tavsif uzun emas', () => {
    ONBOARDING_SLIDES.forEach((slide) => {
      expect(slide.title.length).toBeLessThanOrEqual(34);
      expect(slide.description.length).toBeLessThanOrEqual(180);
    });
  });

  it('vaʼda beriladigan slaydlarda chegara ham aytiladi', () => {
    ONBOARDING_SLIDES.forEach((slide) => {
      expect(slide.caveat).not.toBeNull();
      expect((slide.caveat ?? '').length).toBeGreaterThan(10);
    });
  });

  it('bajarilmaydigan vaʼda yoʻq', () => {
    const texts = ONBOARDING_SLIDES.flatMap((s) => [s.title, s.description, s.caveat ?? '']);
    texts.forEach((text) => {
      const lower = text.toLowerCase();
      ['kafolatlangan', 'eng arzon', 'bir daqiqada', 'xabar beramiz'].forEach((word) =>
        expect(lower).not.toContain(word),
      );
    });
  });

  it('ASCII apostrof yoʻq', () => {
    const texts = [
      ...ONBOARDING_SLIDES.flatMap((s) => [s.title, s.description, s.caveat ?? '']),
      ROLE_STEP_TITLE,
      ROLE_STEP_HINT,
      SKIP_LABEL,
      NEXT_LABEL,
    ];
    texts.forEach((text) => expect(text).not.toMatch(/[a-zA-Z]'[a-zA-Z]/));
  });
});
