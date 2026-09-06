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
 *  - APK ichida (native) — faqat ilovaning oʻzi, `/app` dan boshlanadi;
 *  - brauzerda — qoʻshimcha preview galereyasi ham mavjud.
 *
 * Nativeʼda ildiz yoʻl preview galereyasiga tushib qolsa, foydalanuvchi
 * ilovani umuman koʻrmaydi — shuning uchun u darhol `/app` ga yoʻnaltiriladi.
 */
export function App() {
  useEffect(() => {
    // Preview qobigʻi Light temada; ilova rejimi oʻz temasini oʻzi qoʻllaydi.
    if (!isNative()) applyTheme('light');
  }, []);

  /*
   * Splash HAR QANDAY holatda yopiladi — marshrutga, tarmoqqa yoki ilova
   * holatiga bogʻliq emas. Ilgari uni faqat `/app` ichidagi komponent
   * yopardi, shuning uchun boshqa yoʻlda ilova splashʼda qotib qolardi.
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
