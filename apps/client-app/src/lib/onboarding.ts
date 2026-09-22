/**
 * Tanishtiruv slaydlari — matn jadvali komponentda emas, shu yerda.
 *
 * Ilovaning birinchi jumlalari — eng qimmat vaʼdalar. Har biri BUGUN
 * ishlaydigan narsani aytadi va chegarasini oʻzi bilan olib yuradi:
 * «naqd» deyilganda kafolatli toʻlov yoʻqligi, «AI» deyilganda esa javoblar
 * tayyor matnlardan kelishi shu yerda aytiladi.
 *
 * 2026-09-22 dan matnlar SANTEXNIKAGA qaratildi: platforma boshqa sohada
 * ishlamaydi va birinchi ekran buni ochiq aytadi. Shahar ham shu yerda
 * aytiladi — mijoz buyurtma berishdan OLDIN bilishi kerak.
 */
export interface OnboardingSlide {
  id: string;
  /** Rasm `import` qilinadi — kalit ekranda rasmga bogʻlanadi. */
  imageKey: 'work' | 'price' | 'masters' | 'ai';
  title: string;
  description: string;
  /** Chegara — vaʼdaning ostidagi kichik qator; boʻlmasa `null`. */
  caveat: string | null;
}

export const ONBOARDING_SLIDES: readonly OnboardingSlide[] = [
  {
    id: 'plumbing',
    imageKey: 'work',
    title: 'Santexnika ishlari',
    description:
      'Kran oqyaptimi, quvur yorilganmi, unitaz yoki suv isitgich ishlamayaptimi — ishni roʻyxatdan tanlaysiz va usta oʻzi yetib keladi.',
    caveat: 'Hozircha faqat Namangan shahrida ishlaymiz.',
  },
  {
    id: 'price',
    imageKey: 'price',
    title: 'Narxni oldindan koʻrasiz',
    description:
      'Har bir ishning narxi, ichiga nima kirishi va nima kirmasligi kartada yozilgan. Ish tugagach naqd toʻlaysiz.',
    caveat:
      'Baʼzi ishlarda narx «… dan» koʻrsatiladi — aniq summa joyida maʼlum boʻladi. Pul ilova orqali oʻtmaydi.',
  },
  {
    id: 'trust',
    imageKey: 'masters',
    title: 'Ustani oʻzingiz tasdiqlaysiz',
    description:
      'Usta kartasida bajarilgan ishlar soni va bahosi koʻrinadi. Usta eshik oldiga kelganda uni tasdiqlaysiz.',
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

/** Slaydlar + rejim tanlash. */
export const ONBOARDING_STEPS = ONBOARDING_SLIDES.length + 1;

export const ROLE_STEP_TITLE = 'Qaysi tomondan kirasiz?';

export const ROLE_STEP_HINT = 'Keyinchalik profil orqali istalgan vaqt almashtirasiz.';

export const SKIP_LABEL = 'Oʻtkazib yuborish';

export const NEXT_LABEL = 'Davom etish';
