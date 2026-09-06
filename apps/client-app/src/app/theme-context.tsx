import { createContext, useContext, type ReactNode } from 'react';
import type { ThemeName } from '@/tokens/colors';
import { useThemePreference } from './useThemePreference';

/**
 * Tema tanlovi butun ilova bo'ylab bitta manbadan keladi.
 *
 * Ilgari tema faqat `AppRouter` ichida yashardi va uni almashtirish uchun
 * ekran ustida suzuvchi tugma turardi — u har bir sahifada header ustiga
 * chiqib, ilovani prototipga o'xshatardi. Endi almashtirgich Profil
 * sahifasidagi oddiy sozlama qatoriga ko'chdi, shuning uchun holat
 * kontekst orqali bo'lishiladi.
 */
interface ThemeContextValue {
  theme: ThemeName;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useThemePreference();
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme faqat ThemeProvider ichida ishlatiladi');
  return value;
}
