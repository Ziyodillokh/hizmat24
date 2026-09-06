/**
 * Market — qurilish va taʼmir mollari doʻkonlari.
 *
 * Backend ulanmagunicha roʻyxat shu yerdan keladi. Ish vaqti soat sifatida
 * saqlanadi va "ochiq/yopiq" holati EKRANDA hisoblanadi — mock ichida
 * qatʼiy `isOpen` yozib qoʻyilsa, u soat 3 da ham "Ochiq" deb turaverardi.
 */
export type ShopCategory =
  | 'Qurilish mollari'
  | 'Elektr tovarlar'
  | 'Santexnika'
  | 'Boʻyoq va lak'
  | 'Asboblar';

export interface Shop {
  id: string;
  name: string;
  category: ShopCategory;
  /** Tuman yoki mahalla — mijoz avval "qayerda" ekanini qidiradi. */
  district: string;
  address: string;
  ratingAvg: number;
  reviewsCount: number;
  /** Ish vaqti, mahalliy soat: [ochilish, yopilish). */
  openFrom: number;
  openTo: number;
  /** Yetkazib berish xizmati bormi. */
  hasDelivery: boolean;
  /** Doʻkon telefoni — mahsulot sahifasidagi qoʻngʻiroq tugmasi uchun. */
  phone: string;
}

export const SHOPS: Shop[] = [
  {
    id: 's-qurilish-market',
    name: 'Qurilish Market',
    category: 'Qurilish mollari',
    district: 'Chilonzor',
    address: '9-kvartal, Bunyodkor koʻchasi 12',
    ratingAvg: 4.8,
    reviewsCount: 214,
    openFrom: 8,
    openTo: 20,
    phone: '+998712001101',
    hasDelivery: true,
  },
  {
    id: 's-elektro-plus',
    name: 'Elektro Plus',
    category: 'Elektr tovarlar',
    district: 'Yunusobod',
    address: '4-mavze, Amir Temur shoh koʻchasi 108',
    ratingAvg: 4.7,
    reviewsCount: 168,
    openFrom: 9,
    openTo: 21,
    phone: '+998712001102',
    hasDelivery: true,
  },
  {
    id: 's-santex-dom',
    name: 'Santex Dom',
    category: 'Santexnika',
    district: 'Mirzo Ulugʻbek',
    address: 'Mustaqillik shoh koʻchasi 45',
    ratingAvg: 4.6,
    reviewsCount: 97,
    openFrom: 8,
    openTo: 19,
    phone: '+998712001103',
    hasDelivery: false,
  },
  {
    id: 's-rang-bor',
    name: 'Rang Bor',
    category: 'Boʻyoq va lak',
    district: 'Sergeli',
    address: '2-mavze, Yangi Sergeli koʻchasi 7',
    ratingAvg: 4.5,
    reviewsCount: 63,
    openFrom: 9,
    openTo: 18,
    phone: '+998712001104',
    hasDelivery: true,
  },
  {
    id: 's-asbob-uy',
    name: 'Asbob Uyi',
    category: 'Asboblar',
    district: 'Olmazor',
    address: 'Doʻrmon yoʻli 22',
    ratingAvg: 4.9,
    reviewsCount: 302,
    openFrom: 8,
    openTo: 22,
    phone: '+998712001105',
    hasDelivery: true,
  },
  {
    id: 's-mega-stroy',
    name: 'Mega Stroy',
    category: 'Qurilish mollari',
    district: 'Yashnobod',
    address: 'Tuzel-2, Fargʻona yoʻli 88',
    ratingAvg: 4.4,
    reviewsCount: 141,
    openFrom: 7,
    openTo: 19,
    phone: '+998712001106',
    hasDelivery: false,
  },
  {
    id: 's-svet-lux',
    name: 'Svet Lux',
    category: 'Elektr tovarlar',
    district: 'Shayxontohur',
    address: 'Navoiy koʻchasi 30',
    ratingAvg: 4.3,
    reviewsCount: 58,
    openFrom: 10,
    openTo: 20,
    phone: '+998712001107',
    hasDelivery: false,
  },
  {
    id: 's-akva-servis',
    name: 'Akva Servis',
    category: 'Santexnika',
    district: 'Uchtepa',
    address: 'Qorasaroy koʻchasi 15',
    ratingAvg: 4.6,
    reviewsCount: 119,
    openFrom: 9,
    openTo: 20,
    phone: '+998712001108',
    hasDelivery: true,
  },
];

/** Roʻyxat reyting boʻyicha tartiblangan — eng ishonchlisi tepada. */
export const SHOP_LIST: Shop[] = [...SHOPS].sort(
  (a, b) => b.ratingAvg - a.ratingAvg || b.reviewsCount - a.reviewsCount,
);
