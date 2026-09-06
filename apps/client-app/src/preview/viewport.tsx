import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Ekran qayerda chizilyapti:
 *  - `frame`  — desktop preview'dagi 393×852 maketa ramkasi (soxta status bar bilan);
 *  - `device` — haqiqiy qurilma, to'liq ekran. Bunda soxta status bar CHIZILMAYDI
 *    (telefonning o'zinikisi bor) va uning o'rniga xavfsiz zona bo'shlig'i qo'yiladi.
 */
export type ViewportMode = 'frame' | 'device';

const ViewportContext = createContext<ViewportMode>('frame');

export const useViewportMode = (): ViewportMode => useContext(ViewportContext);

export function ViewportProvider({ mode, children }: { mode: ViewportMode; children: ReactNode }) {
  return <ViewportContext.Provider value={mode}>{children}</ViewportContext.Provider>;
}

/**
 * Maketa ramkasi sig'adigan eng kichik kenglik: frame 393px + ikki tomondan
 * 24px havo. Undan tor oynada ramka o'rniga qurilma rejimi ko'rsatiladi —
 * aks holda telefonda gorizontal scroll paydo bo'lardi.
 */
const FRAME_FIT_WIDTH = 393 + 48;

export function useIsNarrowViewport(): boolean {
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < FRAME_FIT_WIDTH,
  );

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${FRAME_FIT_WIDTH - 1}px)`);
    const update = (event: MediaQueryListEvent | MediaQueryList) => setIsNarrow(event.matches);

    update(query);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isNarrow;
}
