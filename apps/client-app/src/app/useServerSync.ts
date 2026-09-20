import { useCallback, useEffect } from 'react';
import { isApiEnabled } from '@/api/client';
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
 * Xato boʻlsa roʻyxat TEGILMAYDI — qurilmadagi oxirgi holat ekranda qoladi.
 */
export function useServerSync(isReady: boolean): void {
  const { replaceOrders, upsertOrder } = useApp();

  const reload = useCallback(() => {
    void fetchOrders()
      .then(replaceOrders)
      .catch(() => {
        // Jim: Profil ekranidagi holat qatori va amallardagi xato matni
        // foydalanuvchiga ulanish yoʻqligini allaqachon aytadi.
      });
  }, [replaceOrders]);

  useEffect(() => {
    if (!isApiEnabled() || !isReady || !getAccessToken()) return;

    reload();
    return connectRealtime({ onOrder: upsertOrder, onReconnect: reload });
  }, [isReady, reload, upsertOrder]);
}
