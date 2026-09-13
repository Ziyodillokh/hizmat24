import { useLocation } from 'react-router-dom';

/** `navigate(route, { state: { returnTo } })` bilan uzatilgan qaytish manzili. */
export const useReturnTo = (): string | null =>
  (useLocation().state as { returnTo?: string } | null)?.returnTo ?? null;
