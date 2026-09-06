import { useCallback, useEffect, useState } from 'react';
import type { ThemeName } from '@/tokens/colors';

const STORAGE_KEY = 'hizmat24:theme';

/**
 * Tema tanlovi.
 *
 * Boshlang'ich qiymat tizim sozlamasidan olinadi (`prefers-color-scheme`) —
 * haqiqiy ilovadagidek. Foydalanuvchi almashtirsa, tanlovi saqlanadi.
 */
function readInitialTheme(): ThemeName {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // localStorage yopiq bo'lishi mumkin (private rejim) — tizim sozlamasiga qaytamiz.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useThemePreference() {
  const [theme, setTheme] = useState<ThemeName>(readInitialTheme);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Saqlab bo'lmasa ham ilova ishlayveradi.
    }
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    [],
  );

  return { theme, toggleTheme };
}
