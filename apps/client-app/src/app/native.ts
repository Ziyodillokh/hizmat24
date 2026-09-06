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
 * tekshiruvi bilan oʻralgan, shuning uchun dev serverda ham, APK ichida ham
 * bir xil kod ishlaydi.
 */
export const isNative = (): boolean => Capacitor.isNativePlatform();

/**
 * Status bar rangi ilova temasiga moslashadi.
 *
 * Androidʼda status bar ilova ustida turadi, shuning uchun rangi mos
 * kelmasa ilova "web sahifa" boʻlib koʻrinadi.
 */
export async function syncStatusBar(theme: ThemeName): Promise<void> {
  if (!isNative()) return;

  const palette = theme === 'dark' ? DARK : LIGHT;

  try {
    // `Style.Dark` = OQ kontent. Status bar endi ikkala temada ham chuqur teal
    // hero maydoni ustida turadi, shuning uchun tema boʻyicha almashmaydi.
    await StatusBar.setStyle({ style: Style.Dark });
    // Bosh sahifadagi yuqori blok rangi — status bar u bilan qoʻshilib ketsin.
    await StatusBar.setBackgroundColor({ color: palette['surface-hero'] });
  } catch {
    // Baʼzi qurilmalarda status bar boshqarilmaydi — ilova baribir ishlaydi.
  }
}

/** Ilova tayyor boʻlgach splash yopiladi — oq miltillash boʻlmasin. */
export async function hideSplash(): Promise<void> {
  if (!isNative()) return;
  try {
    await SplashScreen.hide();
  } catch {
    // eʼtiborsiz
  }
}

/**
 * Androidʼning apparat "orqaga" tugmasi.
 *
 * Web ilovada bu tugma standart holda ilovani YOPADI. Haqiqiy ilovada esa u
 * navigatsiya tarixi boʻylab qaytaradi va faqat ildiz ekranda chiqishni
 * soʻraydi.
 *
 * `onBack` `true` qaytarsa — hodisa hal qilindi; `false` boʻlsa ilova yopiladi.
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
    // Qurilmada vibro boʻlmasligi mumkin.
  }
}

/** Qaytarib boʻlmaydigan amallar uchun kuchliroq javob. */
export async function warnFeedback(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // eʼtiborsiz
  }
}
