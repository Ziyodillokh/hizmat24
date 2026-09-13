/**
 * NAMUNA fikrlar — serverda mijozlar sharhlari modeli YOʻQ.
 *
 * Ismlar, matnlar va "foydali" sonlari TOʻQIMA, haqiqiy mijozlar emas.
 * Bu roʻyxat faqat "Demo · namuna fikrlar" belgisi ostida chiziladi va
 * hech qachon haqiqiy maʼlumot sifatida taqdim etilmaydi. Server ulangach
 * bu fayl oʻchiriladi.
 *
 * Sana `wallet.ts` seedlari kabi nisbiy (`daysAgo`): qatʼiy sana bir yildan
 * keyin eskirib koʻrinardi. Har bir matn ≤ 68 belgi — 224px kenglikdagi
 * kartada ikki satr `text-body-sm`.
 *
 * `photoUrl` ATAYLAB yoʻq: ustalarning fotolarini mijoz nomi ostida
 * koʻrsatish — bir odamni boshqasi sifatida taqdim etish.
 */
export interface CustomerReview {
  id: string;
  customerName: string;
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string;
  /** Necha kun oldin yozilgan (nisbiy, `reviewDate` bilan sanaga aylanadi). */
  daysAgo: number;
  /** "Foydali" belgilari soni — faqat koʻrsatkich, bosib boʻlmaydi. */
  likeCount: number;
}

export const REVIEW_COMMENT_MAX = 68;

export const SAMPLE_REVIEWS: readonly CustomerReview[] = [
  { id: 'r-1', customerName: 'Otabek R.', stars: 5, comment: 'Usta 40 daqiqada keldi, kranni tez almashtirdi. Narx oldindan aniq.', daysAgo: 3, likeCount: 12 },
  { id: 'r-2', customerName: 'Dilnoza K.', stars: 5, comment: 'Suv isitgichni bir kunda oʻrnatib berishdi, ish toza va tartibli.', daysAgo: 9, likeCount: 8 },
  { id: 'r-3', customerName: 'Sherzod M.', stars: 4, comment: 'Bir oz kechikdi, lekin kanalizatsiyani bir soatda tozalab ketdi.', daysAgo: 16, likeCount: 5 },
  { id: 'r-4', customerName: 'Madina T.', stars: 5, comment: 'Rakovinani almashtirdi, keyin hammasini tekshirib berdi. Rahmat!', daysAgo: 24, likeCount: 3 },
  { id: 'r-5', customerName: 'Jasur A.', stars: 5, comment: 'Quvurlarni yangiladi, ikki hafta oʻtdi — hech qanday oqish yoʻq.', daysAgo: 31, likeCount: 9 },
];

/** Sana hisobi komponentga chiqmasin — bitta joyda. `now` ni OʻZGARTIRMAYDI. */
export const reviewDate = (review: CustomerReview, now: Date): Date => {
  const date = new Date(now);
  date.setDate(now.getDate() - review.daysAgo);
  return date;
};
