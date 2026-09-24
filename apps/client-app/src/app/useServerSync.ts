import { useCallback, useEffect } from 'react';
import { isApiEnabled } from '@/api/client';
import { fetchMasterOrders } from '@/api/master';
import { fetchOrders } from '@/api/orders';
import { connectRealtime } from '@/api/realtime';
import { getAccessToken } from '@/api/session';
import { useApp } from './store';

/**
 * Server bilan sinxronlash: roʻyxatni oʻqish va jonli yangilanish.
 *
 * Ikkalasi bitta joyda, chunki ular bitta savolga javob beradi — «ekrandagi
 * buyurtmalar serverdagi bilan bir xilmi». Ulanish qayta tiklanganda roʻyxat
 * qaytadan oʻqiladi: uzilish paytida kelgan hodisalar yoʻqolgan boʻlishi
 * mumkin.
 *
 * IKKI manba birlashtiriladi: foydalanuvchining OʻZ buyurtmalari va —
 * agar u usta boʻlsa — unga tayinlangan ishlar. Ular bitta massivda
 * yashaydi, farqni `masterBucket` maydoni aytadi. Usta roʻyxati xato
 * bersa (odam hali usta emas — bu normal holat) mijoz roʻyxati baribir
 * yangilanadi.
 *
 * Xato boʻlsa roʻyxat TEGILMAYDI — qurilmadagi oxirgi holat ekranda qoladi.
 */
export function useServerSync(isReady: boolean): void {
  const { isAuthenticated, replaceOrders, upsertOrder } = useApp();

  const reload = useCallback(() => {
    void Promise.all([
      fetchOrders().catch(() => null),
      // Usta boʻlmagan odamda 404 — bu xato emas, holat.
      fetchMasterOrders().catch(() => []),
    ]).then(([mine, assigned]) => {
      if (mine === null) return;

      // Bitta buyurtma ikkala roʻyxatda ham boʻlishi mumkin (odam oʻziga
      // buyurtma bergan). Usta nusxasi ustun: unda `masterBucket` bor.
      const byId = new Map(mine.map((order) => [order.id, order]));
      for (const order of assigned) byId.set(order.id, order);

      replaceOrders([...byId.values()]);
    });
  }, [replaceOrders]);

  /** Faqat ustaning roʻyxati — mijoz roʻyxatiga tegilmaydi. */
  const reloadMasterOrders = useCallback(() => {
    void fetchMasterOrders()
      .then((orders) => orders.forEach(upsertOrder))
      .catch(() => {
        // Usta boʻlmagan odamda 404 — bu xato emas, holat.
      });
  }, [upsertOrder]);

  /*
   * `isReady` — sessiya TIKLANDIMI degan savolga javob. Lekin foydalanuvchi
   * hozirgina kirgan boʻlishi ham mumkin: unda tiklanadigan sessiya yoʻq
   * edi va `isReady` `false` boʻlib qolardi. Natijada yangi kirgan odamda
   * roʻyxat ham, jonli yangilanish ham UMUMAN ishga tushmasdi.
   * Shuning uchun token borligi ham tekshiriladi va kirish holati
   * oʻzgarganda effekt qayta ishlaydi.
   */
  useEffect(() => {
    if (!isApiEnabled() || !getAccessToken()) return;

    reload();
    return connectRealtime({
      onOrder: upsertOrder,
      // Ustaga tayinlangan ish: qisqa signal keldi, roʻyxatni qayta
      // oʻqiymiz — boʻlim (taklif/faol) faqat u yerda bor.
      onMasterOrders: reloadMasterOrders,
      onReconnect: reload,
    });
  }, [isReady, isAuthenticated, reload, reloadMasterOrders, upsertOrder]);
}
