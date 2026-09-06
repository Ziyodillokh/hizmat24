import { Spinner } from '@/components/Spinner';
import { ScreenShell } from '@/screens/_shared/ScreenShell';

/**
 * 01 · Sessiyani tiklash.
 *
 * Ilova ochilganda token tekshirilayotgan qisqa oraliq. Bitta holat —
 * amallar yo'q, orqaga qaytish yo'q.
 *
 * Kirish nuqtalari (11-bo'lim, A qism):
 * 1. Oddiy ochilish → token bor bo'lsa 06 Bosh sahifa, yo'q bo'lsa 02 Kirish taklifi.
 * 2. Push bosilib ochilish (deep-link): avval shu ekran, keyin to'g'ridan-to'g'ri
 *    push ichidagi buyurtma ekrani — bosh sahifa oraliqda ko'rsatilmaydi, lekin
 *    orqaga qaytish bosh sahifaga olib boradi.
 * 3. Deep-link havolasi buzuq, buyurtma o'chirilgan yoki begona bo'lsa →
 *    "Buyurtma topilmadi" + "Buyurtmalarimga qaytish" ekrani (xato modali EMAS).
 * 4. Buyurtma "Usta yetib keldi" holatida bo'lsa → istalgan kirish nuqtasidan
 *    16-ekran majburan ochiladi.
 */
export function SessionRestoreScreen() {
  return (
    <ScreenShell className="flex flex-col items-center justify-center">
      {/* Logotip matnli wordmark — rasm manbai yo'q, shuning uchun tipografiya bilan. */}
      <p className="text-h1 text-primary">Hizmat24</p>

      {/* Spinner shu ekranda ruxsat etilgan to'rt joydan biri (12.1-band). */}
      <Spinner size={32} className="mt-24 text-primary" />
    </ScreenShell>
  );
}
