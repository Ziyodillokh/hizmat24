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

/**
 * Kirish jumlasi SERVER ULANGANLIGIGA qarab oʻzgaradi.
 *
 * «Ilova serversiz ishlaydi» degan jumla server ulangan ilovada YOLGʻON
 * boʻlardi: buyurtmalar haqiqatan boshqa mijozlardan keladi va usta
 * ularni qabul qiladi. Roʻyxatning maʼnosi — rost gapirish, shuning
 * uchun u rejimga qarab oʻzgaradi.
 */
export const masterLimitsIntro = (isServerConnected: boolean): string =>
  isServerConnected
    ? 'Mijoz tomoni serverga ulangan, usta navbati esa hali yoʻq. Quyidagilar ishlamaydi va biz ularni ishlaydigandek koʻrsatmaymiz:'
    : 'Ilova hozir serversiz ishlaydi. Quyidagilar yoʻq va biz ularni yoʻqdek koʻrsatamiz:';

/** Ishlamaydigan imkoniyat yonidagi yagona yorliq. */
export const SOON_LABEL = 'Tez orada';

const ALL_LIMITS: readonly MasterLimit[] = [
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
      'Yangi taklif kelganda telefon ovoz chiqarmaydi: push xizmati hali ulanmagan. Ilova ochiq boʻlsa taklif darhol koʻrinadi.',
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
      'Sertifikat ilovada tekshirilmaydi. Uni faqat admin tasdiqlaydi, tasdiqlanmagunicha belgi chizilmaydi.',
  },
  {
    id: 'otherOrders',
    title: 'Boshqa odamlarning buyurtmalari',
    sentence:
      'Usta navbati serverga hali ulanmagan: takliflar shu telefonda berilgan buyurtmalardan chiqadi, boshqa mijozlarniki tushmaydi.',
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
      'Ish hozircha bitta shahar chegarasida, shuning uchun tuman soʻralmaydi va roʻyxat tuman boʻyicha filtrlanmaydi.',
  },
];

/**
 * Server ulanganda hal boʻlgan chegaralar. Hozircha BOʻSH: mijoz tomoni
 * serverga oʻtgan boʻlsa ham, ustaning ish navbati hali ulanmagan
 * (`/master/offers` — B5 bosqichi). Bu roʻyxatga qator qoʻshishdan
 * oldin oʻsha imkoniyat HAQIQATAN ishlayotganini tekshirish shart.
 */
const SERVER_SOLVED: readonly MasterLimitId[] = [];

export const masterLimits = (isServerConnected: boolean): readonly MasterLimit[] =>
  isServerConnected ? ALL_LIMITS.filter((limit) => !SERVER_SOLVED.includes(limit.id)) : ALL_LIMITS;
