import type { Master } from './types';

export const MASTERS: Record<string, Master> = {
  akmal: {
    id: 'm-akmal',
    fullName: 'Akmal Rahimov',
    profession: 'Santexnik',
    experienceLevel: 'EXPERIENCED',
    hasGovCertificate: true,
    ratingAvg: 4.8,
    completedOrdersCount: 142,
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
    completedOrdersCount: 9,
    phoneNumber: null,
  },
};
