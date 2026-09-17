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
