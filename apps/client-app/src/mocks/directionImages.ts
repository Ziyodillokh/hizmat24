import santexnika from '@/assets/directions/santexnika.webp';
import elektrik from '@/assets/directions/elektrik.webp';

/**
 * Bosh ekrandagi YOʻNALISH kartalarining rasmlari — loyiha egasi bergan
 * (2026-09-26), ilova ichiga joylangan 840x630 WebP.
 *
 * Xizmat rasmlaridan (`serviceImages.ts`) ALOHIDA: yoʻnalish kartasi
 * kattaroq va nisbati boshqa (4:3), shuning uchun bir xil faylni ikki
 * joyda ishlatish birini yoki ikkinchisini buzardi.
 *
 * Kalit — guruhning `iconKey` i, `id` si EMAS: server ulanganda `id`
 * UUID boʻlib keladi va `id` boʻyicha tuzilgan xarita bir kechada
 * ishlamay qolardi.
 *
 * Rasmi yoʻq yoʻnalish soha ikonasi bilan chiziladi — yangi yoʻnalish
 * rasmsiz ham buzilmaydi.
 */
export const DIRECTION_IMAGES: Record<string, string> = {
  plumber: santexnika,
  plug: elektrik,
};
