import type { OrderStatus } from '@/lib/orderStateMachine';

export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  groupId: string;
  basePrice: number;
  /** Xizmatning OʻZ ikonasi. Berilmasa guruhnikini meros qiladi. */
  iconKey?: string;
}

export interface ServiceGroup {
  id: string;
  /**
   * Guruh nomi — bosh sahifa gridida, guruh ekrani sarlavhasida va qidiruv
   * natijalarida bir xil shu nom koʻrsatiladi. Server bitta nom yuboradi;
   * UI unga qisqartirilgan ikkinchi shakl oʻylab topmaydi (8.1-band, yagona atama).
   */
  name: string;
  /** Ilova ikonani shu kalit boʻyicha tanlaydi — rasm URL emas (1-boʻlim, 16-qoida). */
  iconKey: string;
  categories: ServiceCategory[];
}

export type ExperienceLevel = 'NEW' | 'EXPERIENCED';

export interface Master {
  id: string;
  fullName: string;
  profession: string;
  experienceLevel: ExperienceLevel;
  hasGovCertificate: boolean;
  ratingAvg: number;
  completedOrdersCount: number;
  /** Faqat 4 holatda toʻldiriladi (1-boʻlim, 3-qoida). */
  phoneNumber: string | null;
}

export interface OrderAddress {
  label: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
  comment?: string;
}

export type CancelledBy = 'CLIENT' | 'MASTER' | 'SYSTEM';

export interface Order {
  id: string;
  shortId: string;
  status: OrderStatus;
  categoryName: string;
  categoryIconKey: string;
  description: string;
  price: number;
  isUrgent: boolean;
  address: OrderAddress;
  master: Master | null;
  etaMinutes: number | null;
  queuePosition: number | null;
  /** Operator qoʻlda koʻrib chiqmoqda (12/13-ekranlarning alohida holati). */
  isEscalated: boolean;
  createdAt: Date;
  completedAt: Date | null;
  cancelReason: string | null;
  cancelledBy: CancelledBy | null;
  rating: { stars: number; comment: string | null } | null;
}

export type NotificationKind =
  | 'MASTER_ASSIGNED'
  | 'MASTER_EN_ROUTE'
  | 'MASTER_ARRIVED'
  | 'QUEUE_POSITION_UPDATE'
  | 'ORDER_IN_PROGRESS'
  | 'ORDER_COMPLETED_BY_MASTER'
  | 'ORDER_CANCELLED'
  | 'SAFETY_ALERT_RECEIVED'
  | 'MATCHING_ESCALATED';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  /** Sarlavha va matn serverdan tayyor keladi — UI oʻz matnini toʻqimaydi (25-ekran). */
  title: string;
  body: string;
  orderId: string | null;
  sentAt: Date;
  readAt: Date | null;
}

export interface UserProfile {
  fullName: string | null;
  phoneNumber: string;
}
