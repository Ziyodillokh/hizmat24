import female1 from '@/assets/masters/female-1.webp';
import male1 from '@/assets/masters/male-1.webp';
import male2 from '@/assets/masters/male-2.webp';
import type { Master } from './types';

/**
 * Mock ustalar — "Mutaxassislar" ekrani uchun.
 *
 * Backend ulanmagunicha roʻyxat shu yerdan keladi. Kasb nomlari xizmat
 * guruhlari bilan mos: ekran ularni filtr sifatida ishlatadi va yangi kasb
 * qoʻshilsa filtr avtomatik paydo boʻladi.
 *
 * FOTO ustaning jinsiga mos tanlanadi. Hozircha uchta rasm bor (ikkita
 * erkak, bitta ayol), shuning uchun ular takrorlanadi — lekin roʻyxatda
 * YONMA-YON bir xil yuz tushmasligi uchun erkak rasmlari navbatma-navbat
 * qoʻyilgan. Yangi rasm qoʻshilsa, shu yerda bitta qatordan ulanadi.
 */
/*
 * `satisfies` — `Record<string, Master>` EMAS: oxirgisi bilan `MASTERS.umid`
 * kabi mavjud boʻlmagan kalit ham tipdan oʻtib ketardi va xato faqat ish
 * vaqtida, `undefined` koʻrinishida chiqardi.
 */
export const MASTERS = {
  sardor: {
    id: 'm-sardor',
    fullName: 'Sardor Nazarov',
    profession: 'Gaz ustasi',
    experienceLevel: 'EXPERIENCED',
    hasGovCertificate: true,
    ratingAvg: 4.9,
    completedOrdersCount: 210,
    photoUrl: male1,
    phoneNumber: '+998901112237',
  },
  feruza: {
    id: 'm-feruza',
    fullName: 'Feruza Salimova',
    profession: 'Tozalash ustasi',
    experienceLevel: 'EXPERIENCED',
    hasGovCertificate: true,
    ratingAvg: 4.9,
    completedOrdersCount: 178,
    photoUrl: female1,
    phoneNumber: '+998901112241',
  },
  akmal: {
    id: 'm-akmal',
    fullName: 'Akmal Rahimov',
    profession: 'Santexnik',
    experienceLevel: 'EXPERIENCED',
    hasGovCertificate: true,
    ratingAvg: 4.8,
    completedOrdersCount: 142,
    photoUrl: male2,
    phoneNumber: '+998901112233',
  },
  jahongir: {
    id: 'm-jahongir',
    fullName: 'Jahongir Qodirov',
    profession: 'Duradgor',
    experienceLevel: 'EXPERIENCED',
    hasGovCertificate: false,
    ratingAvg: 4.7,
    completedOrdersCount: 96,
    photoUrl: male1,
    phoneNumber: '+998901112238',
  },
  dilshod: {
    id: 'm-dilshod',
    fullName: 'Dilshod Ergashev',
    profession: 'Elektrik',
    experienceLevel: 'EXPERIENCED',
    hasGovCertificate: true,
    ratingAvg: 4.6,
    completedOrdersCount: 87,
    photoUrl: male2,
    phoneNumber: '+998901112235',
  },
  rustam: {
    id: 'm-rustam',
    fullName: 'Rustam Yoʻldoshev',
    profession: 'Texnika ustasi',
    experienceLevel: 'EXPERIENCED',
    hasGovCertificate: true,
    ratingAvg: 4.5,
    completedOrdersCount: 134,
    photoUrl: male1,
    phoneNumber: '+998901112240',
  },
  nilufar: {
    id: 'm-nilufar',
    fullName: 'Nilufar Karimova',
    profession: 'Boʻyoqchi',
    experienceLevel: 'NEW',
    hasGovCertificate: false,
    ratingAvg: 4.4,
    completedOrdersCount: 23,
    photoUrl: female1,
    phoneNumber: '+998901112239',
  },
  bekzod: {
    id: 'm-bekzod',
    fullName: 'Bekzod Toʻraev',
    profession: 'Elektrik',
    experienceLevel: 'NEW',
    hasGovCertificate: false,
    ratingAvg: 4.2,
    completedOrdersCount: 12,
    photoUrl: male2,
    phoneNumber: '+998901112236',
  },
  malika: {
    id: 'm-malika',
    fullName: 'Malika Yusupova',
    profession: 'Santexnik',
    experienceLevel: 'NEW',
    hasGovCertificate: false,
    ratingAvg: 4.1,
    completedOrdersCount: 8,
    photoUrl: female1,
    phoneNumber: '+998901112242',
  },
} satisfies Record<string, Master>;

/** Ekranlar uchun tartiblangan roʻyxat: avval reyting, keyin bajarilgan ish. */
export const MASTER_LIST: Master[] = Object.values(MASTERS).sort(
  (a, b) => b.ratingAvg - a.ratingAvg || b.completedOrdersCount - a.completedOrdersCount,
);
