/**
 * Ilova ataylab QILMAYDIGAN narsalar — yagona rost roʻyxat.
 *
 * Roʻyxat `src/lib` da, chunki u matn jadvali: bir xil jumla `/app/master/limits`
 * sahifasida ham, oʻz joyidagi `DashedChip "Tez orada"` yonida ham
 * takrorlanadi. Ikki nusxa bir kun kelib ikki xil vaʼda berardi.
 *
 * Har bir qator uchun BOSILADIGAN element chizilmaydi (6-boʻlim, 5-qoida):
 * ishlamaydigan imkoniyat tugma emas, `span`.
 */
export type MasterLimitId =
  | 'chat'
  | 'map'
  | 'push'
  | 'payout'
  | 'photo'
  | 'certificate'
  | 'otherOrders'
  | 'price'
  | 'commission'
  | 'districtFilter';

export interface MasterLimit {
  id: MasterLimitId;
  title: string;
  /** Ekranda aynan shu jumla chiziladi — qisqartirilmaydi. */
  sentence: string;
}

export const MASTER_LIMITS_INTRO =
  'Ilova hozir serversiz ishlaydi. Quyidagilar yoʻq va biz ularni yoʻqdek koʻrsatamiz:';

/** Ishlamaydigan imkoniyat yonidagi yagona yorliq. */
export const SOON_LABEL = 'Tez orada';

export const MASTER_LIMITS: readonly MasterLimit[] = [
  {
    id: 'chat',
    title: 'Yozishuv (chat)',
    sentence: 'Yozishuv yoʻq — mijoz bilan faqat telefon orqali gaplashasiz.',
  },
  {
    id: 'map',
    title: 'Jonli xarita, GPS, masofa',
    sentence:
      'Ilova joylashuvingizni bilmaydi. Mijoz sizning yoʻlda ekaningizni siz tugmani bosganingizda koʻradi.',
  },
  {
    id: 'push',
    title: 'Push bildirishnoma',
    sentence:
      'Yangi taklif kelganda telefon ovoz chiqarmaydi: bildirishnoma serverdan keladi, server ulanmagan.',
  },
  {
    id: 'payout',
    title: 'Pul oʻtkazish, yechish, hisob raqami',
    sentence: 'Pulni mijozdan naqd olasiz. Ilovada hisob ham, pul yechish ham yoʻq.',
  },
  {
    id: 'photo',
    title: 'Ish fotosi',
    sentence:
      'Ish surati hozircha yuklanmaydi: qurilmada kamera moduli ulanmagan. Ishni matn bilan tasvirlaysiz.',
  },
  {
    id: 'certificate',
    title: 'Hujjat/sertifikat tekshiruvi',
    sentence:
      'Sertifikat ilovada tekshirilmaydi. U hamma joyda «oʻzim aytdim, tekshirilmagan» deb belgilanadi.',
  },
  {
    id: 'otherOrders',
    title: 'Boshqa odamlarning buyurtmalari',
    sentence: 'Server ulanmagan — boshqa mijozlarning buyurtmalari ilovaga tushmaydi.',
  },
  {
    id: 'price',
    title: 'Narxni oʻzgartirish',
    sentence:
      'Narxni oʻzgartirish yoʻq: summa buyurtma berilganda kelishilgan va chekda shu turadi.',
  },
  {
    id: 'commission',
    title: 'Komissiya foizi va sof daromad',
    sentence: 'Platforma komissiyasi foizi hali belgilanmagan — sof daromad koʻrsatilmaydi.',
  },
  {
    id: 'districtFilter',
    title: 'Tumanlar boʻyicha filtr',
    sentence:
      'Tumanlar arizada koʻrsatiladi. Buyurtma manzilida tuman maydoni yoʻq, shuning uchun roʻyxat tuman boʻyicha filtrlanmaydi.',
  },
];
