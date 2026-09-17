/**
 * Tanishtiruv slaydlari — matn jadvali komponentda emas, shu yerda.
 *
 * Ilovaning birinchi uchta jumlasi — eng qimmat vaʼdalar. Har biri BUGUN
 * ishlaydigan narsani aytadi va chegarasini oʻzi bilan olib yuradi:
 * «naqd» deyilganda kafolatli toʻlov yoʻqligi, «AI» deyilganda esa javoblar
 * tayyor matnlardan kelishi shu yerda aytiladi.
 */
export interface OnboardingSlide {
  id: string;
  /** Rasm `import` qilinadi — kalit ekranda rasmga bogʻlanadi. */
  imageKey: 'work' | 'masters' | 'ai';
  title: string;
  description: string;
  /** Chegara — vaʼdaning ostidagi kichik qator; boʻlmasa `null`. */
  caveat: string | null;
}

export const ONBOARDING_SLIDES: readonly OnboardingSlide[] = [
  {
    id: 'payment',
    imageKey: 'work',
    title: 'Ish tugagach naqd toʻlaysiz',
    description:
      'Ustani chaqirasiz, ishni koʻrasiz va pulni qoʻlma-qoʻl berasiz. Summa buyurtma berilganda kelishiladi va oʻzgarmaydi.',
    caveat: 'Pul ilova orqali oʻtmaydi. Kafolatli toʻlov Click va Payme ulangach qoʻshiladi.',
  },
  {
    id: 'trust',
    imageKey: 'masters',
    title: 'Ustani oʻzingiz tekshirasiz',
    description:
      'Har bir usta kartasida reyting, bajarilgan ishlar soni va tajriba darajasi koʻrsatiladi. Usta eshik oldida kelganda uni tasdiqlaysiz.',
    caveat: 'Tasdiqlamasangiz ish boshlanmaydi va buyurtma toʻxtatiladi.',
  },
  {
    id: 'assistant',
    imageKey: 'ai',
    title: 'Savolingizga javob topasiz',
    description:
      'Narx, jadval va kafolat boʻyicha savollarga yordamchi javob beradi — qoʻngʻiroq qilib oʻtirmaysiz.',
    caveat: 'Javoblar hozircha tayyor matnlardan keladi — bu haqiqiy AI emas.',
  },
];

/** Uchta slayd + rejim tanlash. */
export const ONBOARDING_STEPS = ONBOARDING_SLIDES.length + 1;

export const ROLE_STEP_TITLE = 'Qaysi tomondan kirasiz?';

export const ROLE_STEP_HINT = 'Keyinchalik profil orqali istalgan vaqt almashtirasiz.';

export const SKIP_LABEL = 'Oʻtkazib yuborish';

export const NEXT_LABEL = 'Davom etish';
