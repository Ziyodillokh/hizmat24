import type { ServiceCategory, ServiceGroup } from './types';

/**
 * Katalog ikki qavatli: guruh → xizmat (1-boʻlim, 16-qoida).
 * Narxlar HAR XIL — bir xil narx yagona tarif taassurotini beradi (07a-ekran).
 *
 * PLATFORMA HOZIRCHA FAQAT SANTEXNIKA (egasining qarori, 2026-09-13):
 * elektrika, gaz, texnika, duradgorlik, boʻyoqchilik va tozalash guruhlari
 * olib tashlandi. Tuzilma ikki qavatli qoldi — yangi soha qoʻshish bitta
 * guruh yozuvi.
 */
export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: 'g-plumbing',
    name: 'Santexnika',
    iconKey: 'plumber',
    // Birinchi beshtasi bosh sahifadagi 3×2 panjara (egasining maketi,
    // 2026-09-13) — tartib maʼnoli, oʻzgartirmang. c-drain va c-heating
    // faqat guruh sahifasida. ID lar oʻzgarmaydi: hamyon seedlari va
    // wallet.test.ts ularga bogʻlangan.
    categories: [
      { id: 'c-repair', iconKey: 'plumbing-repair', name: 'Santexnika taʼmiri', description: 'Oqish, shovqin, buzilgan jihoz', groupId: 'g-plumbing', basePrice: 120_000 },
      { id: 'c-water-heater', iconKey: 'water-heater', name: 'Suv isitgich xizmatlari', description: 'Oʻrnatish va taʼmirlash', groupId: 'g-plumbing', basePrice: 300_000 },
      { id: 'c-toilet', iconKey: 'toilet', name: 'Unitaz va kanalizatsiya', description: 'Oʻrnatish, almashtirish, tiqilish', groupId: 'g-plumbing', basePrice: 250_000 },
      { id: 'c-tap', iconKey: 'tap', name: 'Rakovina va smesitel', description: 'Kran, sifon, oqish', groupId: 'g-plumbing', basePrice: 100_000 },
      { id: 'c-pipes', iconKey: 'pipes', name: 'Quvurlarni oʻrnatish', description: 'Suv va isitish quvurlari', groupId: 'g-plumbing', basePrice: 400_000 },
      { id: 'c-drain', iconKey: 'drain', name: 'Kanalizatsiya tozalash', description: 'Tiqilib qolgan quvur', groupId: 'g-plumbing', basePrice: 200_000 },
      { id: 'c-heating', iconKey: 'heating', name: 'Isitish tizimini ulash', description: null, groupId: 'g-plumbing', basePrice: 900_000 },
    ],
  },
];

/**
 * 07-ekran uchun tekis roʻyxat.
 *
 * Har bir xizmatning OʻZ ikonasi bor; berilmagan boʻlsa guruhnikiga tushadi.
 * Kalit shu yerda bir marta hisoblanadi va ekranlar guruhni qayta qidirmaydi.
 */
export interface FlatServiceCategory extends ServiceCategory {
  iconKey: string;
  groupName: string;
}

export const ALL_CATEGORIES: FlatServiceCategory[] = SERVICE_GROUPS.flatMap((group) =>
  group.categories.map((category) => ({
    ...category,
    iconKey: category.iconKey ?? group.iconKey,
    groupName: group.name,
  })),
);

export const findGroup = (groupId: string): ServiceGroup | undefined =>
  SERVICE_GROUPS.find((group) => group.id === groupId);
