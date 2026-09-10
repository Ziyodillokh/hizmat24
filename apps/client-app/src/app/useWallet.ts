import { useMemo } from 'react';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { buildWalletView, type WalletView } from '@/lib/wallet';
import { materializeTransactions } from '@/mocks/wallet';
import { useApp } from './store';

/**
 * "Karta" boʻlimining uchala ekrani shu bitta koʻrinish modelidan oziqlanadi.
 *
 * Nega alohida `WalletProvider` YOʻQ: `ChatProvider` bor, chunki chatda
 * foydalanuvchi OʻZGARTIRADIGAN holat bor (yozgan xabar) va u saqlanishi
 * shart. Hamyonda esa foydalanuvchi oʻzgartiradigan hech narsa yoʻq — hamma
 * raqam (mock, buyurtmalar, joriy vaqt) uchligining sof funksiyasi. Faqat
 * oʻqiladigan hosilani contextʼga oʻrash bitta ortiqcha render chegarasi va
 * nol foyda beradi.
 *
 * `localStorage` ham yozilmaydi: kiritma (`orders`) allaqachon saqlanadi,
 * hosilani saqlash esa ikkinchi haqiqat manbaini yaratardi.
 */
export function useWallet(): WalletView {
  const { orders } = useApp();
  // Daqiqalik soat: ekran ochiq turganda yarim tunda "Bugun" eskirib qolmasin.
  const now = useMinuteClock();

  /*
   * Mock sanalari KUNIGA bir marta qayta hisoblanadi. Modul yuklanganda bir
   * marta muzlatilsa, ilova ochiq qolgan holda oy almashganda butun "shu oy"
   * bloki boʻshab qolardi. Har daqiqada qayta hisoblash ham notoʻgʻri: roʻyxat
   * qayta saralanib qatorlar siljib turardi.
   */
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const mock = useMemo(
    () => materializeTransactions(now.getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey],
  );

  return useMemo(() => buildWalletView(mock, orders, now), [mock, orders, now]);
}
