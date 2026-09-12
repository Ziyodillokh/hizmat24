import type { Master } from '@/mocks/types';

/**
 * Sevimli ustalar.
 *
 * NIMA ISHLAYDI: usta profilini ochish, u bilan yozishish va keyingi
 * buyurtmada AYNAN shu ustani soʻrash. Uchalasi ham haqiqiy — chat
 * `openThread` istalgan usta bilan suhbat yaratadi, buyurtmaga esa endi
 * tanlangan usta yoziladi.
 *
 * NIMA ISHLAMAYDI: bandlik, narx, ish jadvali va masofa. `Master` tipida
 * bu maydonlar YOʻQ, shuning uchun "hozir boʻsh", "80 000 soʻmdan" yoki
 * "sizga 2 km" kabi hech narsa yozilmaydi — ular oʻylab chiqarilgan
 * boʻlardi.
 */
export interface FavoriteEntry {
  masterId: string;
  addedAt: Date;
}

export const isFavorite = (list: readonly FavoriteEntry[], masterId: string): boolean =>
  list.some((item) => item.masterId === masterId);

/**
 * Qoʻshadi yoki olib tashlaydi va YANGI massiv qaytaradi.
 *
 * Kirish massivi oʻzgartirilmaydi — holat faqat `setState` orqali almashadi.
 */
export function toggleFavorite(
  list: readonly FavoriteEntry[],
  masterId: string,
  now: Date,
): FavoriteEntry[] {
  if (isFavorite(list, masterId)) return list.filter((item) => item.masterId !== masterId);
  return [...list, { masterId, addedAt: now }];
}

/** Eng oxirida qoʻshilgani birinchi. Kirish massivi oʻzgartirilmaydi. */
export const sortFavorites = (list: readonly FavoriteEntry[]): FavoriteEntry[] =>
  [...list].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());

export interface ResolvedFavorite {
  entry: FavoriteEntry;
  master: Master;
}

/**
 * Yozuvlarni haqiqiy usta maʼlumotiga ulaydi.
 *
 * Topilmagan `masterId` JIMGINA TUSHIB QOLADI. Bu holat mumkin: qurilmada
 * saqlangan yozuv eski, usta esa roʻyxatdan chiqib ketgan. Buzilgan karta
 * chizish yoki "usta oʻchirilgan" degan qator yozish foydalanuvchiga hech
 * narsa bermaydi — u bu yozuvni qoʻshganini ham eslamaydi.
 */
export function resolveFavorites(
  list: readonly FavoriteEntry[],
  lookup: (id: string) => Master | undefined,
): ResolvedFavorite[] {
  return sortFavorites(list).flatMap((entry) => {
    const master = lookup(entry.masterId);
    return master ? [{ entry, master }] : [];
  });
}
