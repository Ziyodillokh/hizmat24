import type { ServiceCategory, ServiceGroup } from './types';

/**
 * Katalog ikki qavatli: guruh → xizmat (1-bo'lim, 16-qoida).
 * Narxlar HAR XIL — bir xil narx yagona tarif taassurotini beradi (07a-ekran).
 */
export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: 'g-electric',
    name: 'Elektrika',
    iconKey: 'electrician',
    categories: [
      { id: 'c-socket', name: "Rozetka o'rnatish", description: "Bitta nuqta, devor ichida", groupId: 'g-electric', basePrice: 80_000 },
      { id: 'c-lamp', name: "Lyustra o'rnatish", description: null, groupId: 'g-electric', basePrice: 120_000 },
      { id: 'c-breaker', name: 'Avtomat almashtirish', description: 'Shchitdagi avtomat', groupId: 'g-electric', basePrice: 150_000 },
      { id: 'c-rewire', name: "To'liq elektr simlarini almashtirish", description: "Xonadon bo'ylab", groupId: 'g-electric', basePrice: 1_500_000 },
    ],
  },
  {
    id: 'g-plumbing',
    name: 'Santexnika',
    iconKey: 'plumber',
    categories: [
      { id: 'c-tap', name: "Kran ta'mirlash", description: 'Oshxona yoki vannaxona', groupId: 'g-plumbing', basePrice: 100_000 },
      { id: 'c-toilet', name: "Unitaz o'rnatish", description: null, groupId: 'g-plumbing', basePrice: 250_000 },
      { id: 'c-drain', name: 'Kanalizatsiya tozalash', description: 'Tiqilib qolgan quvur', groupId: 'g-plumbing', basePrice: 200_000 },
      { id: 'c-heating', name: 'Isitish tizimini ulash', description: null, groupId: 'g-plumbing', basePrice: 900_000 },
    ],
  },
  {
    id: 'g-gas',
    name: 'Gaz',
    iconKey: 'gas',
    categories: [
      { id: 'c-stove', name: 'Gaz plitasi ulash', description: 'Sertifikatli usta talab qilinadi', groupId: 'g-gas', basePrice: 350_000 },
      { id: 'c-boiler', name: 'Gaz kolonkasi ulash', description: null, groupId: 'g-gas', basePrice: 500_000 },
    ],
  },
  {
    id: 'g-appliance',
    name: 'Texnika',
    iconKey: 'appliance',
    categories: [
      { id: 'c-washer', name: 'Kir yuvish mashinasini ulash', description: null, groupId: 'g-appliance', basePrice: 150_000 },
      { id: 'c-ac', name: "Konditsioner o'rnatish", description: 'Split tizim', groupId: 'g-appliance', basePrice: 400_000 },
    ],
  },
  { id: 'g-carpentry', name: 'Duradgorlik', iconKey: 'carpenter', categories: [
    { id: 'c-door', name: "Eshik o'rnatish", description: null, groupId: 'g-carpentry', basePrice: 300_000 },
    { id: 'c-furniture', name: "Mebel yig'ish", description: null, groupId: 'g-carpentry', basePrice: 180_000 },
  ] },
  { id: 'g-painting', name: "Bo'yoqchilik", iconKey: 'painter', categories: [
    { id: 'c-wall', name: "Devor bo'yash", description: null, groupId: 'g-painting', basePrice: 220_000 },
  ] },
  { id: 'g-cleaning', name: 'Tozalash', iconKey: 'cleaning', categories: [
    { id: 'c-general', name: 'Umumiy tozalash', description: null, groupId: 'g-cleaning', basePrice: 350_000 },
  ] },
];

/**
 * 07-ekran uchun tekis ro'yxat.
 *
 * Xizmatning o'z ikonasi yo'q — u guruhning `iconKey` sini meros qilib oladi,
 * shuning uchun ikona kaliti shu yerda bir marta biriktiriladi va ekranlar
 * guruhni qayta qidirmaydi.
 */
export interface FlatServiceCategory extends ServiceCategory {
  iconKey: string;
  groupName: string;
}

export const ALL_CATEGORIES: FlatServiceCategory[] = SERVICE_GROUPS.flatMap((group) =>
  group.categories.map((category) => ({
    ...category,
    iconKey: group.iconKey,
    groupName: group.name,
  })),
);

export const findGroup = (groupId: string): ServiceGroup | undefined =>
  SERVICE_GROUPS.find((group) => group.id === groupId);
