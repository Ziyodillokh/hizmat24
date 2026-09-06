import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { DARK, LIGHT, type ThemeName } from '@/tokens/colors';

/**
 * Native qatlam bilan aloqa.
 *
 * Har bir chaqiruv brauzerda ham xavfsiz: `Capacitor.isNativePlatform()`
 * tekshiruvi bilan o'ralgan, shuning uchun dev serverda ham, APK ichida ham
 * bir xil kod ishlaydi.
 */
export const isNative = (): boolean => Capacitor.isNativePlatform();

/**
 * Status bar rangi ilova temasiga moslashadi.
 *
 * Android'da status bar ilova ustida turadi, shuning uchun rangi mos
 * kelmasa ilova "web sahifa" bo'lib ko'rinadi.
 */
export async function syncStatusBar(theme: ThemeName): Promise<void> {
  if (!isNative()) return;

  const palette = theme === 'dark' ? DARK : LIGHT;

  try {
    await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
    // Bosh sahifadagi yuqori blok rangi — status bar u bilan qo'shilib ketsin.
    await StatusBar.setBackgroundColor({ color: palette['surface-hero'] });
  } catch {
    // Ba'zi qurilmalarda status bar boshqarilmaydi — ilova baribir ishlaydi.
  }
}

/** Ilova tayyor bo'lgach splash yopiladi — oq miltillash bo'lmasin. */
export async function hideSplash(): Promise<void> {
  if (!isNative()) return;
  try {
    await SplashScreen.hide();
  } catch {
    // e'tiborsiz
  }
}

/**
 * Android'ning apparat "orqaga" tugmasi.
 *
 * Web ilovada bu tugma standart holda ilovani YOPADI. Haqiqiy ilovada esa u
 * navigatsiya tarixi bo'ylab qaytaradi va faqat ildiz ekranda chiqishni
 * so'raydi.
 *
 * `onBack` `true` qaytarsa — hodisa hal qilindi; `false` bo'lsa ilova yopiladi.
 */
export function registerBackButton(onBack: () => boolean): () => void {
  if (!isNative()) return () => undefined;

  const handle = CapacitorApp.addListener('backButton', () => {
    if (!onBack()) {
      void CapacitorApp.exitApp();
    }
  });

  return () => {
    void handle.then((listener) => listener.remove());
  };
}

/** Muhim amallarda yengil tebranish — tugma bosilgani sezilsin. */
export async function tapFeedback(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Qurilmada vibro bo'lmasligi mumkin.
  }
}

/** Qaytarib bo'lmaydigan amallar uchun kuchliroq javob. */
export async function warnFeedback(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // e'tiborsiz
  }
}
