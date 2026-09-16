import type { UserRole } from '@/app/types';

/**
 * Rejim (mijoz / usta) — marshrut qarorlarining yagona manbai.
 *
 * Bitta APK ichida ikki rejim yashaydi va ularning uyi boshqa-boshqa. Qaysi
 * ekran ochilishini komponent emas, shu modul hal qiladi: qaror uchta joyda
 * kerak boʻladi (kirish ayrilishi, gvardiya, rejim almashtirish) va uchtasi
 * bir xil javob berishi shart.
 *
 * Modul SOF: `localStorage` ham, `new Date()` ham chaqirilmaydi.
 */

/** Rejim tanlash ekrani — gvardiya shu yerga tushiradi. */
export const MODE_ROUTE = '/app/mode';

/** Rejim sababi (`?kerak=usta`) va qaytish yoʻli (`?keyin=…`) parametrlari. */
export const MODE_REASON_PARAM = 'kerak';
export const MODE_NEXT_PARAM = 'keyin';

/** Sababdagi qiymat — oʻzbekcha, chunki u foydalanuvchi koʻradigan URL da turadi. */
const REASON_VALUES: Record<UserRole, string> = {
  client: 'mijoz',
  master: 'usta',
};

export const MODE_LABELS: Record<UserRole, string> = {
  client: 'Mijoz rejimi',
  master: 'Usta rejimi',
};

/** Qator ichida, yorliq yonida ishlatiladigan qisqa nom (Profil → «Rejim»). */
export const MODE_SHORT_LABELS: Record<UserRole, string> = {
  client: 'Mijoz',
  master: 'Usta',
};

export const MODE_DESCRIPTIONS: Record<UserRole, string> = {
  client: 'Usta chaqirasiz, buyurtma berasiz va ishni koʻrib turib naqd toʻlaysiz.',
  master: 'Ish takliflarini qabul qilasiz, ishni yuritasiz va yigʻilgan pulni koʻrasiz.',
};

/**
 * Usta rejimiga tegishli BARCHA marshrutlar.
 *
 * `parseNextRoute` faqat shu roʻyxatga ishonadi: gvardiya URL ga yozgan
 * «qaytish yoʻli» foydalanuvchi tahrirlashi mumkin boʻlgan matn.
 */
export const MASTER_ROUTES: readonly string[] = [
  '/app/master/jobs',
  '/app/master/history',
  '/app/master/earnings',
  '/app/master/profile',
  '/app/master/limits',
  '/app/master/setup',
  '/app/master/settings',
  '/app/master/apply',
];

export const HOME_ROUTE_FOR: Record<UserRole, string> = {
  client: '/app/home',
  master: '/app/master/jobs',
};

/**
 * Rejim uyi. Rolsiz sessiya «mijoz» deb TAXMIN QILINMAYDI — u rejim
 * tanlashga tushadi.
 */
export function modeHome(role: UserRole | null): string {
  return role === null ? MODE_ROUTE : HOME_ROUTE_FOR[role];
}

export interface LandingInput {
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  role: UserRole | null;
}

/**
 * `/app` index marshruti nimani chizishi.
 *
 * `null` — kirish ekrani shu yerda chiziladi (yoʻnaltirish yoʻq). Qolgan
 * uchta holat `<Navigate replace>` uchun manzil qaytaradi.
 */
export function landingRoute(input: LandingInput): string | null {
  if (!input.isAuthenticated) return null;
  if (!input.hasOnboarded) return '/app/onboarding';
  return modeHome(input.role);
}

export interface EntryOptions {
  /** Usta profilida kamida bitta qadam toʻldirilganmi. */
  hasMasterSteps?: boolean;
}

/**
 * Rejimga birinchi marta kirishda ochiladigan ekran.
 *
 * Profili umuman boshlanmagan usta boʻsh «Ishlar» ekraniga emas, sozlash
 * oqimining birinchi qadamiga tushadi: u yerda qiladigan ishi bor.
 */
export function entryRouteFor(role: UserRole, options: EntryOptions = {}): string {
  if (role === 'master' && options.hasMasterSteps === false) {
    return '/app/master/setup?step=profession';
  }
  return HOME_ROUTE_FOR[role];
}

/** Qaytish yoʻlining uzunlik chegarasi — URL ga yozilgan matn cheksiz emas. */
export const NEXT_ROUTE_MAX = 100;

/**
 * Faqat ilova ichidagi yoʻl: harf, raqam, `-`, `/`, `:` va oddiy qidiruv.
 * Tashqi manzil (`https://…`, `//x`) shu qorovuldan oʻtmaydi.
 */
const SAFE_NEXT_ROUTE = /^\/app\/[a-zA-Z0-9\-/:]*(\?[a-zA-Z0-9\-=&_%]*)?$/;

const isMasterRoute = (path: string): boolean => MASTER_ROUTES.includes(path);

/**
 * Gvardiya yozgan qaytish yoʻlini oʻqiydi.
 *
 * `target` — foydalanuvchi endi kiradigan rejim. Yoʻl OʻSHA rejimga tegishli
 * boʻlishi shart: usta yoʻliga mijoz sifatida qaytarish gvardiyani yana
 * ishga tushiradi va ikki ekran bir-birini cheksiz yoʻnaltiradi.
 */
export function parseNextRoute(raw: string | null, target: UserRole): string | null {
  if (!raw) return null;
  if (raw.length > NEXT_ROUTE_MAX) return null;
  if (!SAFE_NEXT_ROUTE.test(raw)) return null;

  const path = raw.split('?')[0];

  // Usta fazosidagi TANILMAGAN yoʻl ikkala rejim uchun ham rad etiladi: mijoz
  // uchun `/app/master/...` begona, usta uchun esa jadvalda yoʻq yoʻl 404 ga
  // olib borardi. Mijoz yoʻllari roʻyxati yuritilmaydi — ular gvardiyasiz.
  if (path.startsWith('/app/master')) {
    return target === 'master' && isMasterRoute(path) ? raw : null;
  }
  return target === 'client' ? raw : null;
}

/** `?kerak=usta` → `master`. Notoʻgʻri qiymat sababsiz sahifa beradi. */
export function parseModeReason(raw: string | null): UserRole | null {
  if (raw === REASON_VALUES.master) return 'master';
  if (raw === REASON_VALUES.client) return 'client';
  return null;
}

/** Gvardiya yoʻnaltiradigan manzil: sabab + qaytish yoʻli. */
export function modeRouteFor(role: UserRole, next: string): string {
  const params = new URLSearchParams({
    [MODE_REASON_PARAM]: REASON_VALUES[role],
    [MODE_NEXT_PARAM]: next,
  });
  return `${MODE_ROUTE}?${params.toString()}`;
}

export function switchToastFor(mode: UserRole): string {
  return `${MODE_LABELS[mode]}ga oʻtdingiz`;
}

export interface MasterHintInput {
  isComplete: boolean;
  done: number;
  total: number;
}

/** Usta kartasidagi ishora — profil qay darajada toʻldirilgani. */
export function masterModeHint(input: MasterHintInput): string {
  if (input.isComplete) return 'Profil toʻliq';
  if (input.done === 0) return 'Profil hali boshlanmagan';
  return `Profil: ${input.done}/${input.total} qadam`;
}
