import coverConstruction from '@/assets/market/cover-construction.webp';
import coverElectrical from '@/assets/market/cover-electrical.webp';
import coverPaint from '@/assets/market/cover-paint.webp';
import coverPlumbing from '@/assets/market/cover-plumbing.webp';
import coverTools from '@/assets/market/cover-tools.webp';
import prodConstruction1 from '@/assets/market/prod-construction-1.webp';
import prodConstruction2 from '@/assets/market/prod-construction-2.webp';
import prodConstruction3 from '@/assets/market/prod-construction-3.webp';
import prodElectrical1 from '@/assets/market/prod-electrical-1.webp';
import prodElectrical2 from '@/assets/market/prod-electrical-2.webp';
import prodPaint1 from '@/assets/market/prod-paint-1.webp';
import prodPlumbing1 from '@/assets/market/prod-plumbing-1.webp';
import prodPlumbing2 from '@/assets/market/prod-plumbing-2.webp';
import prodPlumbing3 from '@/assets/market/prod-plumbing-3.webp';
import prodTools1 from '@/assets/market/prod-tools-1.webp';
import prodTools2 from '@/assets/market/prod-tools-2.webp';
import prodTools3 from '@/assets/market/prod-tools-3.webp';
import type { ShopCategory } from '@/mocks/shops';

/**
 * Market rasmlari.
 *
 * Rasmlar ilova ICHIGA joylangan (`src/assets/market`, WebP, jami ~230 KB),
 * tashqi manzildan yuklanmaydi. Sabab: APK internetsiz ochilishi mumkin va
 * bunda tashqi havoladagi rasm oʻrnida boʻsh maydon qolardi — xuddi shrift
 * bilan boʻlgani kabi.
 *
 * Rasmlar KATEGORIYA darajasida: har bir mahsulotning oʻz fotosi yoʻq.
 * Doʻkon oʻz rasmlarini yuklaguncha bu vaqtinchalik oʻrindosh, shuning uchun
 * `productImage()` mahsulot indeksiga qarab bir nechta variantdan birini
 * beradi — aks holda ikki ustunli katakchada bir xil rasm takrorlanib,
 * roʻyxat "yuklanmagan"dek koʻrinardi.
 *
 * Manba: Unsplash. Unsplash litsenziyasi bepul foydalanishga, shu jumladan
 * tijorat maqsadida, ruxsat beradi. Ishga tushirishdan oldin doʻkonlarning
 * OʻZ fotolariga almashtirilishi kerak.
 */
const COVERS: Record<ShopCategory, string> = {
  'Qurilish mollari': coverConstruction,
  'Elektr tovarlar': coverElectrical,
  Santexnika: coverPlumbing,
  'Boʻyoq va lak': coverPaint,
  Asboblar: coverTools,
};

const PRODUCTS: Record<ShopCategory, readonly string[]> = {
  'Qurilish mollari': [prodConstruction1, prodConstruction2, prodConstruction3],
  'Elektr tovarlar': [prodElectrical1, prodElectrical2],
  Santexnika: [prodPlumbing1, prodPlumbing2, prodPlumbing3],
  'Boʻyoq va lak': [prodPaint1],
  Asboblar: [prodTools1, prodTools2, prodTools3],
};

/** Doʻkon muqovasi. */
export const shopCover = (category: ShopCategory): string => COVERS[category];

/**
 * Mahsulot rasmi. `index` — mahsulotning roʻyxatdagi tartibi; variantlar
 * shu boʻyicha navbatlashadi va yonma-yon bir xil rasm tushmaydi.
 */
export function productImage(category: ShopCategory, index: number): string {
  const variants = PRODUCTS[category];
  return variants[index % variants.length];
}
