import akmalPhoto from '@/assets/masters/akmal.webp';
import type { Master } from './types';

/**
 * Mock ustalar — "Mutaxassislar" ekrani uchun.
 *
 * Backend ulanmagunicha roʻyxat shu yerdan keladi. Kasb nomlari xizmat
 * guruhlari bilan mos: ekran ularni filtr sifatida ishlatadi va yangi kasb
 * qoʻshilsa filtr avtomatik paydo boʻladi.
 */
export const MASTERS: Record<string, Master> = {
  akmal: {
    id: 'm-akmal',
    fullName: 'Akmal Rahimov',
    profession: 'Santexnik',
    experienceLevel: 'EXPERIENCED',
    hasGovCertificate: true,
    ratingAvg: 4.8,
    completedOrdersCount: 142,
    photoUrl: akmalPhoto,
    phoneNumber: '+998901112233',
  },
  dilshod: {
    id: 'm-dilshod',
    fullName: 'Dilshod Ergashev',
    profession: 'Elektrik',
    experienceLevel: 'EXPERIENCED',
    hasGovCertificate: true,
    ratingAvg: 4.6,
    completedOrdersCount: 87,
    phoneNumber: '+998901112235',
  },
  bekzod: {
    id: 'm-bekzod',
    fullName: "Bekzod Toʻraev",
    profession: 'Elektrik',
    experienceLevel: 'NEW',
    hasGovCertificate: false,
    ratingAvg: 4.2,
    completedOrdersCount: 12,
    phoneNumber: '+998901112236',
  },
  sardor: {
    id: 'm-sardor',
    fullName: 'Sardor Nazarov',
    profession: 'Gaz ustasi',
    experienceLevel: 'EXPERIENCED',
    hasGovCertificate: true,
    ratingAvg: 4.9,
    completedOrdersCount: 210,
    phoneNumber: '+998901112237',
  },
  jahongir: {
    id: 'm-jahongir',
    fullName: 'Jahongir Qodirov',
    profession: 'Duradgor',
    experienceLevel: 'EXPERIENCED',
    hasGovCertificate: false,
    ratingAvg: 4.7,
    completedOrdersCount: 96,
    phoneNumber: '+998901112238',
  },
  umid: {
    id: 'm-umid',
    fullName: 'Umid Xolmatov',
    profession: 'Boʻyoqchi',
    experienceLevel: 'NEW',
    hasGovCertificate: false,
    ratingAvg: 4.4,
    completedOrdersCount: 23,
    phoneNumber: '+998901112239',
  },
  rustam: {
    id: 'm-rustam',
    fullName: 'Rustam Yoʻldoshev',
    profession: 'Texnika ustasi',
    experienceLevel: 'EXPERIENCED',
    hasGovCertificate: true,
    ratingAvg: 4.5,
    completedOrdersCount: 134,
    phoneNumber: '+998901112240',
  },
  feruza: {
    id: 'm-feruza',
    fullName: 'Feruza Salimova',
    profession: 'Tozalash ustasi',
    experienceLevel: 'EXPERIENCED',
    hasGovCertificate: true,
    ratingAvg: 4.9,
    completedOrdersCount: 178,
    phoneNumber: '+998901112241',
  },
  otabek: {
    id: 'm-otabek',
    fullName: 'Otabek Ismoilov',
    profession: 'Santexnik',
    experienceLevel: 'NEW',
    hasGovCertificate: false,
    ratingAvg: 4.1,
    completedOrdersCount: 8,
    phoneNumber: '+998901112242',
  },
};

/** Ekranlar uchun tartiblangan roʻyxat: avval reyting, keyin bajarilgan ish. */
export const MASTER_LIST: Master[] = Object.values(MASTERS).sort(
  (a, b) => b.ratingAvg - a.ratingAvg || b.completedOrdersCount - a.completedOrdersCount,
);
