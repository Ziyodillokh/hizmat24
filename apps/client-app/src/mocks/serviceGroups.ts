import type { ServiceCategory, ServiceGroup } from './types';

/**
 * Katalog ikki qavatli: guruh → xizmat (1-boʻlim, 16-qoida).
 * Narxlar HAR XIL — bir xil narx yagona tarif taassurotini beradi (07a-ekran).
 */
export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: 'g-electric',
    name: 'Elektrika',
    iconKey: 'electrician',
    categories: [
      { id: 'c-socket', iconKey: 'socket', name: "Rozetka oʻrnatish", description: "Bitta nuqta, devor ichida", groupId: 'g-electric', basePrice: 80_000 },
      { id: 'c-lamp', iconKey: 'lamp', name: "Lyustra oʻrnatish", description: null, groupId: 'g-electric', basePrice: 120_000 },
      { id: 'c-breaker', iconKey: 'breaker', name: 'Avtomat almashtirish', description: 'Shchitdagi avtomat', groupId: 'g-electric', basePrice: 150_000 },
      { id: 'c-rewire', iconKey: 'rewire', name: "Toʻliq elektr simlarini almashtirish", description: "Xonadon boʻylab", groupId: 'g-electric', basePrice: 1_500_000 },
    ],
  },
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
  {
    id: 'g-gas',
    name: 'Gaz',
    iconKey: 'gas',
    categories: [
      { id: 'c-stove', iconKey: 'stove', name: 'Gaz plitasi ulash', description: 'Sertifikatli usta talab qilinadi', groupId: 'g-gas', basePrice: 350_000 },
      { id: 'c-boiler', iconKey: 'boiler', name: 'Gaz kolonkasi ulash', description: null, groupId: 'g-gas', basePrice: 500_000 },
    ],
  },
  {
    id: 'g-appliance',
    name: 'Texnika',
    iconKey: 'appliance',
    categories: [
      { id: 'c-washer', iconKey: 'washer', name: 'Kir yuvish mashinasini ulash', description: null, groupId: 'g-appliance', basePrice: 150_000 },
      { id: 'c-ac', iconKey: 'ac', name: "Konditsioner oʻrnatish", description: 'Split tizim', groupId: 'g-appliance', basePrice: 400_000 },
    ],
  },
  { id: 'g-carpentry', name: 'Duradgorlik', iconKey: 'carpenter', categories: [
    { id: 'c-door', iconKey: 'door', name: "Eshik oʻrnatish", description: null, groupId: 'g-carpentry', basePrice: 300_000 },
    { id: 'c-furniture', iconKey: 'furniture', name: "Mebel yigʻish", description: null, groupId: 'g-carpentry', basePrice: 180_000 },
  ] },
  { id: 'g-painting', name: "Boʻyoqchilik", iconKey: 'painter', categories: [
    { id: 'c-wall', iconKey: 'wall', name: "Devor boʻyash", description: null, groupId: 'g-painting', basePrice: 220_000 },
  ] },
  { id: 'g-cleaning', name: 'Tozalash', iconKey: 'cleaning', categories: [
    { id: 'c-general', iconKey: 'general', name: 'Umumiy tozalash', description: null, groupId: 'g-cleaning', basePrice: 350_000 },
  ] },
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
