import { Lightbulb, PaintBucket, Package, Shower, Toolbox } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { ShopCategory } from '@/mocks/shops';

/**
 * Market kategoriyasi ikonalari.
 *
 * Alohida fayl: kategoriya nomi serverdan keladi va ikona xaritasi
 * komponent ichida yashiringanda uni yangilash uchun UI kodini ochish
 * kerak boʻlardi. Xizmat ikonalari (`serviceIcons.ts`) ham shu tartibda.
 */
const ICONS: Record<ShopCategory, IconGlyph> = {
  'Qurilish mollari': Package,
  'Elektr tovarlar': Lightbulb,
  Santexnika: Shower,
  'Boʻyoq va lak': PaintBucket,
  Asboblar: Toolbox,
};

/** Nomaʼlum kategoriya kelsa ham layout buzilmasin — neytral zaxira. */
export const shopCategoryIcon = (category: ShopCategory): IconGlyph => ICONS[category] ?? Package;
