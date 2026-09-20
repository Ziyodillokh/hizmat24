import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'hizmat24.admin.theme';

export type Theme = 'light' | 'dark';

const readStored = (): Theme | null => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
};

/**
 * Tema tanlovi. Tanlanmagan boʻlsa tizimnikiga ergashadi — panel kechqurun
 * ochilganda koʻzni qamashtirmasin.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(
    () =>
      readStored() ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Saqlash bloklangan — tanlov shu sessiya uchun qoladi.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
