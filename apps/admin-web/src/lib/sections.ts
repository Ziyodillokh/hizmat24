/**
 * Panel boʻlimlari — serverdagi `admin-permissions.ts` bilan BIR XIL
 * kalitlar.
 *
 * Ruxsatni bu yer hal QILMAYDI: qaysi boʻlim koʻrinishini server
 * `GET /admin/me` javobida aytadi. Bu yerda faqat har bir kalitning
 * koʻrinadigan nomi, manzili va tayyorligi turadi.
 *
 * `stage` — boʻlim qaysi bosqichda ishlay boshlaydi. `null` boʻlsa
 * allaqachon ishlaydi. Tayyor boʻlmagan boʻlim menyuda YASHIRILMAYDI:
 * admin oʻz roli nimaga yetishini koʻrib turishi kerak, lekin ochganda
 * unga ochiq aytiladi — soxta jadval koʻrsatilmaydi.
 */
export interface SectionMeta {
  key: string;
  title: string;
  path: string;
  /** Tayyor boʻlmagan boʻlim uchun bosqich nomi; tayyor boʻlsa `null`. */
  stage: string | null;
  /** Boʻlim nima qilishini bir qatorda aytadi. */
  summary: string;
}

const SECTIONS: readonly SectionMeta[] = [
  {
    key: 'dashboard',
    title: 'Boshqaruv',
    path: '/dashboard',
    stage: null,
    summary: 'Tizimning umumiy holati',
  },
  {
    key: 'applications',
    title: 'Usta arizalari',
    path: '/applications',
    stage: null,
    summary: 'Yangi ustalarni tekshirish va tasdiqlash',
  },
  {
    key: 'orders',
    title: 'Buyurtmalar',
    path: '/orders',
    stage: 'A3',
    summary: 'Jonli buyurtmalar va eskalatsiya',
  },
  {
    key: 'safety',
    title: 'Xavfsizlik',
    path: '/safety',
    stage: 'A4',
    summary: 'Mijozlardan kelgan xavfsizlik signallari',
  },
  {
    key: 'users',
    title: 'Foydalanuvchilar',
    path: '/users',
    stage: 'A5',
    summary: 'Mijozlar va ustalar roʻyxati',
  },
  {
    key: 'catalog',
    title: 'Katalog',
    path: '/catalog',
    stage: null,
    summary: 'Xizmatlar va ularning narxlari',
  },
  {
    key: 'reports',
    title: 'Hisobotlar',
    path: '/reports',
    stage: 'A7',
    summary: 'Statistika va audit yozuvlari',
  },
  {
    key: 'admins',
    title: 'Adminlar',
    path: '/admins',
    stage: 'A8',
    summary: 'Panel foydalanuvchilarini boshqarish',
  },
];

const BY_KEY = new Map(SECTIONS.map((section) => [section.key, section]));

/**
 * Server aytgan kalitlarni menyu elementlariga aylantiradi.
 *
 * Notanish kalit TASHLAB YUBORILADI: server yangilanib, panel eskirgan
 * boʻlsa, menyuda nomsiz va manzilsiz element paydo boʻlishidan koʻra
 * uning umuman koʻrinmagani yaxshi.
 */
export const menuFor = (keys: readonly string[]): SectionMeta[] =>
  keys.map((key) => BY_KEY.get(key)).filter((section): section is SectionMeta => Boolean(section));

export const sectionByPath = (path: string): SectionMeta | undefined =>
  SECTIONS.find((section) => section.path === path);

/** Kirgandan keyin qayerga tushadi — rolga qarab BIRINCHI mavjud boʻlim. */
export const landingPath = (keys: readonly string[]): string =>
  menuFor(keys)[0]?.path ?? '/dashboard';

export const ALL_SECTIONS = SECTIONS;
