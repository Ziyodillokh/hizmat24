import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { registerBackButton } from './native';

/**
 * Ildiz ekranlar — bu yerda "orqaga" bosh sahifaga qaytaradi.
 *
 * Market va Mutaxassislar bu roʻyxatdan CHIQARILDI: ular endi tab emas,
 * ichki ekran. Ularda "orqaga" bir qadam orqaga qaytishi kerak, aks holda
 * Mahsulot → Doʻkon → Market zanjiri oʻrniga darhol bosh sahifaga sakrardi.
 */
export const ROOT_ROUTES = new Set([
  '/app',
  '/app/home',
  '/app/wallet',
  '/app/orders',
  '/app/chat',
  '/app/notifications',
  '/app/profile',
]);

/**
 * Android apparat "orqaga" tugmasi.
 *
 * Standart holda u WebViewʼni yopib ilovadan chiqaradi. Haqiqiy ilovada esa:
 *  - ichki ekranda — bir qadam orqaga;
 *  - tab ildizida — bosh sahifaga;
 *  - bosh sahifada — ilovadan chiqish.
 *
 * Bloklovchi ekranlarda (usta tasdiqlash, xavfsizlik natijasi) orqaga qaytish
 * TAQIQLANADI — bu spec talabi (1-boʻlim, 4-qoida).
 */
export function useBackButton(): void {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    return registerBackButton(() => {
      // Bloklovchi ekranlar: hodisa "hal qilindi" deb hisoblanadi, lekin
      // hech qayerga oʻtilmaydi — foydalanuvchi tanlov qilishi shart.
      if (path.endsWith('/confirm-master') || path.endsWith('/safety')) {
        return true;
      }

      // Toʻlov chekiga tasdiqlashdan `replace` bilan kelinadi, demak tarixda
      // boʻshatilgan qoralama qolgan. Bir qadam orqaga qaytish oʻsha yerga
      // tushirardi — buyurtmaning oʻziga oʻtamiz.
      if (path.endsWith('/payment-receipt')) {
        navigate(path.replace('/payment-receipt', ''), { replace: true });
        return true;
      }

      /*
       * Baholash bloklovchi ekran emas, lekin bir qadam orqaga qaytish
       * buyurtma ekraniga tushadi va u yakunlangan buyurtmani darhol shu
       * yerga qaytaradi — apparat tugmasi umuman ishlamayotgandek
       * koʻrinardi. Buyurtma yoʻqolmaydi: u aktiv roʻyxatda qoladi va bosh
       * sahifadagi karta orqali ochiladi.
       *
       * Naqsh ANIQ yoziladi: `endsWith('/map')` kabi qoida buyurtma berish
       * oqimidagi `/app/new/map` ni ham ushlab olardi.
       */
      if (/^\/app\/order\/[^/]+\/rate$/.test(path)) {
        navigate('/app/home', { replace: true });
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
