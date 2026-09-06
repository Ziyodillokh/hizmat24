import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Ekran qayerda chizilyapti:
 *  - `frame`  — desktop previewʼdagi 393×852 maketa ramkasi (soxta status bar bilan);
 *  - `device` — haqiqiy qurilma, toʻliq ekran. Bunda soxta status bar CHIZILMAYDI
 *    (telefonning oʻzinikisi bor) va uning oʻrniga xavfsiz zona boʻshligʻi qoʻyiladi.
 */
export type ViewportMode = 'frame' | 'device';

const ViewportContext = createContext<ViewportMode>('frame');

export const useViewportMode = (): ViewportMode => useContext(ViewportContext);

export function ViewportProvider({ mode, children }: { mode: ViewportMode; children: ReactNode }) {
  return <ViewportContext.Provider value={mode}>{children}</ViewportContext.Provider>;
}

/**
 * Maketa ramkasi sigʻadigan eng kichik kenglik: frame 393px + ikki tomondan
 * 24px havo. Undan tor oynada ramka oʻrniga qurilma rejimi koʻrsatiladi —
 * aks holda telefonda gorizontal scroll paydo boʻlardi.
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
