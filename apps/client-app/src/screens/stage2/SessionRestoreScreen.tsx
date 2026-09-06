import { Spinner } from '@/components/Spinner';
import { ScreenShell } from '@/screens/_shared/ScreenShell';

/**
 * 01 · Sessiyani tiklash.
 *
 * Ilova ochilganda token tekshirilayotgan qisqa oraliq. Bitta holat —
 * amallar yoʻq, orqaga qaytish yoʻq.
 *
 * Kirish nuqtalari (11-boʻlim, A qism):
 * 1. Oddiy ochilish → token bor boʻlsa 06 Bosh sahifa, yoʻq boʻlsa 02 Kirish taklifi.
 * 2. Push bosilib ochilish (deep-link): avval shu ekran, keyin toʻgʻridan-toʻgʻri
 *    push ichidagi buyurtma ekrani — bosh sahifa oraliqda koʻrsatilmaydi, lekin
 *    orqaga qaytish bosh sahifaga olib boradi.
 * 3. Deep-link havolasi buzuq, buyurtma oʻchirilgan yoki begona boʻlsa →
 *    "Buyurtma topilmadi" + "Buyurtmalarimga qaytish" ekrani (xato modali EMAS).
 * 4. Buyurtma "Usta yetib keldi" holatida boʻlsa → istalgan kirish nuqtasidan
 *    16-ekran majburan ochiladi.
 */
export function SessionRestoreScreen() {
  return (
    <ScreenShell className="flex flex-col items-center justify-center">
      {/* Logotip matnli wordmark — rasm manbai yoʻq, shuning uchun tipografiya bilan. */}
      <p className="text-h1 text-primary">Hizmat24</p>

      {/* Spinner shu ekranda ruxsat etilgan toʻrt joydan biri (12.1-band). */}
      <Spinner size={32} className="mt-24 text-primary" />
    </ScreenShell>
  );
}
