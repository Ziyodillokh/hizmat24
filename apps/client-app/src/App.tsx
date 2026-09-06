import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { applyTheme } from './lib/theme';
import { PreviewIndex } from './preview/PreviewIndex';
import { ScreenPreview } from './preview/ScreenPreview';
import { ComponentGallery } from './preview/ComponentGallery';
import { AppRouter } from './app/AppRouter';
import { hideSplash, isNative } from './app/native';
import './screens/registerScreens';

/**
 * Ilova ikki rejimda ishlaydi:
 *  - APK ichida (native) — faqat ilovaning o'zi, `/app` dan boshlanadi;
 *  - brauzerda — qo'shimcha preview galereyasi ham mavjud.
 *
 * Native'da ildiz yo'l preview galereyasiga tushib qolsa, foydalanuvchi
 * ilovani umuman ko'rmaydi — shuning uchun u darhol `/app` ga yo'naltiriladi.
 */
export function App() {
  useEffect(() => {
    // Preview qobig'i Light temada; ilova rejimi o'z temasini o'zi qo'llaydi.
    if (!isNative()) applyTheme('light');
  }, []);

  /*
   * Splash HAR QANDAY holatda yopiladi — marshrutga, tarmoqqa yoki ilova
   * holatiga bog'liq emas. Ilgari uni faqat `/app` ichidagi komponent
   * yopardi, shuning uchun boshqa yo'lda ilova splash'da qotib qolardi.
   */
  useEffect(() => {
    void hideSplash();
  }, []);

  if (isNative()) {
    return (
      <Routes>
        <Route path="/app/*" element={<AppRouter />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<PreviewIndex />} />
      <Route path="/s/:id" element={<ScreenPreview />} />
      <Route path="/components" element={<ComponentGallery />} />
      <Route path="/app/*" element={<AppRouter />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
