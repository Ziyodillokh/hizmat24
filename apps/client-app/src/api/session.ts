/**
 * Joriy `access` token — XOTIRADA.
 *
 * Diskda saqlanmaydi: umri 15 daqiqa va u `refresh` tokendan har safar
 * qaytadan olinadi. Modul darajasidagi oddiy qiymat, React holati emas:
 * uni `src/api` dagi har bir soʻrov oʻqiydi va ular komponent emas.
 */
let accessToken: string | null = null;

/**
 * Token oʻzgarganini eshitadiganlar.
 *
 * React tomoni tokenning bor-yoʻqligini BILISHI shart: chiqarish qarori
 * shunga qarab qabul qilinadi. Obunasiz u faqat boshqa biror holat
 * oʻzgargandagina qayta oʻqilardi va sessiya yoʻqolgani sezilmay
 * qolishi mumkin edi.
 */
const listeners = new Set<(token: string | null) => void>();

export const setAccessToken = (token: string | null): void => {
  if (accessToken === token) return;

  accessToken = token;
  for (const listener of listeners) listener(token);
};

export const getAccessToken = (): string | null => accessToken;

/** Obuna; qaytgan funksiya obunani bekor qiladi. */
export function subscribeToAccessToken(listener: (token: string | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * `access` tokenni yangilaydigan ishlov — ilova qatlamidan ulanadi.
 *
 * `api` qatlami qurilmadagi saqlashni BILMAYDI (u `app/auth-persistence`
 * da). Shuning uchun yangilash funksiyasi shu yerga roʻyxatdan
 * oʻtkaziladi — panel tomonidagi 401 ishlovi bilan bir xil naqsh.
 *
 * `true` — token yangilandi va soʻrovni qayta yuborsa boʻladi.
 */
type SessionRefresher = () => Promise<boolean>;

let refresher: SessionRefresher | null = null;

/**
 * Uchib turgan yangilash.
 *
 * Bir vaqtda kelgan 401 lar BITTA yangilashni kutadi. Usiz ikkala soʻrov
 * ham AYNI refresh tokenni yuborardi: server birinchisini qabul qilib
 * tokenni almashtiradi, ikkinchisini esa «qayta ishlatilgan» deb rad
 * etadi va ilova saqlangan tokenni oʻchirib, foydalanuvchini chiqarib
 * yuborardi. Roʻyxat aynan parallel oʻqiladi (`useServerSync`), shuning
 * uchun bu nazariy emas — 15 daqiqadan keyin muntazam yuz berardi.
 */
let inFlight: Promise<boolean> | null = null;

export const setSessionRefresher = (next: SessionRefresher | null): void => {
  refresher = next;
  inFlight = null;
};

export const refreshAccessToken = async (): Promise<boolean> => {
  if (!refresher) return false;
  if (inFlight) return inFlight;

  inFlight = refresher().finally(() => {
    inFlight = null;
  });

  return inFlight;
};
