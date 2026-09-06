import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { registerBackButton } from './native';

/** Ildiz ekranlar — bu yerda "orqaga" ilovadan chiqishni so'raydi. */
const ROOT_ROUTES = new Set([
  '/app',
  '/app/home',
  '/app/orders',
  '/app/notifications',
  '/app/profile',
]);

/**
 * Android apparat "orqaga" tugmasi.
 *
 * Standart holda u WebView'ni yopib ilovadan chiqaradi. Haqiqiy ilovada esa:
 *  - ichki ekranda — bir qadam orqaga;
 *  - tab ildizida — bosh sahifaga;
 *  - bosh sahifada — ilovadan chiqish.
 *
 * Bloklovchi ekranlarda (usta tasdiqlash, xavfsizlik natijasi) orqaga qaytish
 * TAQIQLANADI — bu spec talabi (1-bo'lim, 4-qoida).
 */
export function useBackButton(): void {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    return registerBackButton(() => {
      // Bloklovchi ekranlar: hodisa "hal qilindi" deb hisoblanadi, lekin
      // hech qayerga o'tilmaydi — foydalanuvchi tanlov qilishi shart.
      if (path.endsWith('/confirm-master') || path.endsWith('/safety')) {
        return true;
      }

      if (path === '/app/home' || path === '/app') {
        return false; // ilovadan chiqish
      }

      if (ROOT_ROUTES.has(path)) {
        navigate('/app/home');
        return true;
      }

      navigate(-1);
      return true;
    });
  }, [location.pathname, navigate]);
}
