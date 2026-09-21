import { createContext, useContext } from 'react';

/**
 * Sessiya tiklanishi tugadimi — ekranlar uchun.
 *
 * `useSessionRestore` natijasi `AppRouter` da yashaydi va serverga
 * murojaat qiladigan ekran unga yetib bora olmasdi. Natijada ekran
 * ochilishi bilan soʻrov yuborilar, access token esa hali yoʻq edi —
 * 401 va «sessiya tugadi» degan yolgʻon xabar.
 *
 * `null` — hali tiklanmoqda, soʻrov yuborilmaydi; `true`/`false` —
 * tugadi, endi tokenning bor-yoʻqligi hal qiladi.
 */
const SessionReadyContext = createContext<boolean | null>(null);

export const SessionReadyProvider = SessionReadyContext.Provider;

export const useSessionReady = (): boolean | null => useContext(SessionReadyContext);
