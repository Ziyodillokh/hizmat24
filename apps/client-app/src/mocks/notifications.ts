import type { NotificationType } from '@/components/NotificationRow';
import type { AppNotification, NotificationKind } from './types';
import { NOW } from './orders';

const minutesAgo = (minutes: number): Date => new Date(NOW.getTime() - minutes * 60_000);

/** Sarlavha va matn serverdan tayyor keladi — UI o'z matnini to'qimaydi (25-ekran). */
export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-1', kind: 'MASTER_ARRIVED', title: 'Usta yetib keldi',
    body: "Iltimos, kelgan ustani ilovadagi ma'lumot bilan solishtiring va tasdiqlang",
    orderId: 'o-arrived', sentAt: minutesAgo(3), readAt: null,
  },
  {
    id: 'n-2', kind: 'MASTER_EN_ROUTE', title: "Usta yo'lga chiqdi",
    body: "Usta sizga qarab yo'lga chiqdi", orderId: 'o-enroute', sentAt: minutesAgo(18), readAt: null,
  },
  {
    id: 'n-3', kind: 'MASTER_ASSIGNED', title: 'Usta topildi',
    body: 'Buyurtmangizga usta tayinlandi', orderId: 'o-assigned', sentAt: minutesAgo(42), readAt: null,
  },
  {
    id: 'n-4', kind: 'QUEUE_POSITION_UPDATE', title: 'Siz navbatdasiz',
    body: "Navbatdagi o'rningiz: 3. Taxminiy kutish: 20 daqiqa",
    orderId: 'o-queued', sentAt: minutesAgo(95), readAt: minutesAgo(90),
  },
  {
    id: 'n-5', kind: 'ORDER_COMPLETED_BY_MASTER', title: 'Ish yakunlandi',
    body: 'Iltimos, ustaning ishini baholang', orderId: 'o-completed', sentAt: minutesAgo(180), readAt: minutesAgo(170),
  },
  {
    id: 'n-6', kind: 'ORDER_CANCELLED', title: 'Buyurtma bekor qilindi',
    body: "Muammo o'zi hal bo'ldi", orderId: 'o-cancelled', sentAt: minutesAgo(60 * 26), readAt: minutesAgo(60 * 25),
  },
  {
    id: 'n-7', kind: 'MATCHING_ESCALATED', title: 'Usta qidirilmoqda',
    body: "Hozircha bo'sh usta yo'q — operatorimiz buyurtmangizni qo'lda ko'rib chiqadi",
    orderId: 'o-queued', sentAt: minutesAgo(60 * 30), readAt: minutesAgo(60 * 29),
  },
];

export const UNREAD_COUNT = NOTIFICATIONS.filter((n) => n.readAt === null).length;


/**
 * Backend bildirishnoma turlari UI turlariga xaritalanadi.
 *
 * Ular ataylab bir xil emas: backend enum'i buyurtma hodisasini nomlaydi
 * (`ORDER_COMPLETED_BY_MASTER`), UI esa qatorning ko'rinishini
 * (`WORK_COMPLETED` — check ikonasi, `success` tusi). Xaritalash shu yerda
 * bir marta qilinadi, ekranlarda takrorlanmaydi.
 */
const KIND_TO_UI: Record<NotificationKind, NotificationType> = {
  MASTER_ASSIGNED: 'MASTER_ASSIGNED',
  MASTER_EN_ROUTE: 'MASTER_EN_ROUTE',
  MASTER_ARRIVED: 'MASTER_ARRIVED',
  QUEUE_POSITION_UPDATE: 'QUEUED',
  ORDER_IN_PROGRESS: 'WORK_STARTED',
  ORDER_COMPLETED_BY_MASTER: 'WORK_COMPLETED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  SAFETY_ALERT_RECEIVED: 'SAFETY_FLAGGED',
  MATCHING_ESCALATED: 'OPERATOR_SEARCHING',
};

export const notificationUiType = (kind: NotificationKind): NotificationType => KIND_TO_UI[kind];
