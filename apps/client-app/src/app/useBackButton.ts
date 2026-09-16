import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MODE_ROUTE, modeHome } from '@/lib/appMode';
import { MASTER_TAB_ROUTES } from './masterTabRoutes';
import { closeTopOverlay } from '@/lib/overlayStack';
import { registerBackButton } from './native';
import { useApp } from './store';

/**
 * Ildiz ekranlar — bu yerda "orqaga" bosh sahifaga qaytaradi.
 *
 * Market va Mutaxassislar bu roʻyxatdan CHIQARILDI: ular endi tab emas,
 * ichki ekran. Ularda "orqaga" bir qadam orqaga qaytishi kerak, aks holda
 * Mahsulot → Doʻkon → Market zanjiri oʻrniga darhol bosh sahifaga sakrardi.
 *
 * Ustaning toʻrtta tabi ham shu yerda: ular ham ildiz ekran. `/app/mode`
 * esa roʻyxatga QOʻSHILMAYDI — u alohida qoida bilan ishlanadi, chunki
 * rolsiz sessiyada qaytadigan uy yoʻq.
 */
export const ROOT_ROUTES = new Set([
  '/app',
  '/app/home',
  '/app/wallet',
  '/app/orders',
  '/app/notifications',
  '/app/profile',
  ...Object.values(MASTER_TAB_ROUTES),
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
  const { role } = useApp();

  useEffect(() => {
    const path = location.pathname;
    // "Uy" rejimga qarab ayriladi: usta uchun u `/app/master/jobs`.
    const home = modeHome(role);

    return registerBackButton(() => {
      // Ochiq varaq/oyna avval yopiladi — sahifa almashmaydi.
      if (closeTopOverlay()) return true;

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
       * Naqsh ANIQ yoziladi: `endsWith('/rate')` kabi qoida boshqa
       * oqimlarning oxirgi qadamini ham ushlab olardi.
       */
      if (/^\/app\/order\/[^/]+\/rate$/.test(path)) {
        navigate('/app/home', { replace: true });
        return true;
      }

      /*
       * Rejim tanlash ekrani ildiz emas: rolsiz sessiyada uning ORQASIDA
       * hech narsa yoʻq (kirish ayrilishi uni oʻzi chizadi), shuning uchun
       * orqaga bosish ilovadan chiqaradi. Roli bor foydalanuvchi esa oʻz
       * uyiga qaytadi.
       */
      if (path === MODE_ROUTE) {
        if (role === null) return false;
        navigate(home);
        return true;
      }

      if (path === home || path === '/app') {
        return false; // ilovadan chiqish
      }

      if (ROOT_ROUTES.has(path)) {
        navigate(home);
        return true;
      }

      navigate(-1);
      return true;
    });
  }, [location.pathname, navigate, role]);
}
