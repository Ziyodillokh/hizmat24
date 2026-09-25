import { createContext, useContext } from 'react';
import { toReadyFlag, type SessionOutcome } from '@/lib/sessionGuard';

/**
 * Sessiya tiklanishining natijasi — ekranlar uchun.
 *
 * `useSessionRestore` natijasi `AppRouter` da yashaydi va serverga
 * murojaat qiladigan ekran unga yetib bora olmasdi. Natijada ekran
 * ochilishi bilan soʻrov yuborilar, access token esa hali yoʻq edi —
 * 401 va «sessiya tugadi» degan yolgʻon xabar.
 */
const SessionOutcomeContext = createContext<SessionOutcome>('pending');

export const SessionReadyProvider = SessionOutcomeContext.Provider;

/** Toʻliq holat — chiqarish qarorini shu yerdan qabul qilinadi. */
export const useSessionOutcome = (): SessionOutcome => useContext(SessionOutcomeContext);

/**
 * Eski shartnoma: `null` — hali tiklanmoqda, soʻrov yuborilmaydi;
 * `true`/`false` — tugadi.
 */
export const useSessionReady = (): boolean | null => toReadyFlag(useContext(SessionOutcomeContext));
