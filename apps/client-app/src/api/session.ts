/**
 * Joriy `access` token — XOTIRADA.
 *
 * Diskda saqlanmaydi: umri 15 daqiqa va u `refresh` tokendan har safar
 * qaytadan olinadi. Modul darajasidagi oddiy qiymat, React holati emas:
 * uni `src/api` dagi har bir soʻrov oʻqiydi va ular komponent emas.
 */
let accessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

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

export const setSessionRefresher = (next: SessionRefresher | null): void => {
  refresher = next;
};

export const refreshAccessToken = async (): Promise<boolean> =>
  refresher ? refresher() : false;
