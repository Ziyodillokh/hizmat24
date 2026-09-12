import type { LiveOrder } from '@/app/types';
import { addressDetailsLine } from './address';
import { formatPhone, formatPrice, formatShortDate, formatTime, orEmpty } from './formatters';
import { NEGATIVE_TAGS } from './rating';
import { METHOD_LABELS } from './wallet';

/**
 * Murojaat matnini tayyorlash — sof funksiyalar.
 *
 * BU NIZO TIZIMI EMAS. Nizoni koʻrib chiqadigan operator ham, backend ham
 * yoʻq. Bu yerda bajariladigan ish boshqa: murojaat yozish NARXINI tushirish.
 *
 * Bugun foydalanuvchi qoʻllab-quvvatlashga yozmoqchi boʻlsa, buyurtma
 * raqamini, sanani, usta ismini va summani qoʻlda qidirib topishi kerak —
 * koʻpchilik shu yerda voz kechadi. Tayyor matn esa haqiqiy va oʻlchanadigan
 * yordam va u hech qanday backend talab qilmaydi.
 */

/** Foydalanuvchi ochgan kanal. Boshqa qiymat YOʻQ — SMS ham, email ham ulanmagan. */
export type DisputeChannel = 'telegram' | 'phone';

export interface DisputeChannelEvent {
  channel: DisputeChannel;
  openedAt: Date;
}

export interface DisputeRecord {
  /** Ichki kalit. EKRANDA HECH QACHON CHIZILMAYDI. */
  id: string;
  orderId: string;
  /** Koʻrsatiladigan YAGONA identifikator — chekdagi bilan bir xil. */
  orderShortId: string;
  categoryName: string;
  reason: string;
  goal: DisputeGoal;
  /** Foydalanuvchi yozgan matn, `trim` qilingan. */
  note: string;
  /** Tayyorlangan toʻliq matn — qayta nusxalash uchun saqlanadi. */
  message: string;
  createdAt: Date;
  /** Foydalanuvchi ochgan kanallar, eng eskisi birinchi. */
  openedChannels: DisputeChannelEvent[];
  /**
   * Foydalanuvchi OʻZI "hal boʻldi" deb belgilagan payt.
   *
   * Platformaning qarori EMAS: hakam ham, koʻrib chiquvchi ham yoʻq va
   * "koʻrib chiqilmoqda" degan holat yozilmaydi.
   */
  resolvedAt: Date | null;
}

/** Xavfsizlik turi — alohida konstanta: ekran uni solishtirib 102 blokini chizadi. */
export const SAFETY_REASON = 'Xavfsizlik yoki firibgarlik';

/**
 * Muammo turlari.
 *
 * Yangi lugʻat OʻYLAB TOPILMAYDI: oʻrtadagi beshtasi baholashdagi salbiy
 * teglar bilan aynan bir xil — `rating.ts` yagona manba boʻlib qoladi.
 */
export const DISPUTE_REASONS = [
  'Usta umuman kelmadi',
  'Ish yarim qoldi',
  ...NEGATIVE_TAGS,
  SAFETY_REASON,
  'Boshqa muammo',
] as const;

/** Foydalanuvchi nimani kutmoqda — chegara matni aynan shundan tanlanadi. */
export type DisputeGoal = 'fix' | 'refund' | 'report';

export const DISPUTE_GOALS: readonly DisputeGoal[] = ['fix', 'refund', 'report'];

export const DISPUTE_GOAL_LABELS: Record<DisputeGoal, string> = {
  fix: 'Ish tuzatilsin',
  refund: 'Pul qaytarilsin',
  report: 'Faqat xabar bermoqchiman',
};

/**
 * Izoh eng kami.
 *
 * 10 belgi, 20 emas: uzun izoh talab qilish eng asabiy daqiqadagi eng katta
 * toʻsiq boʻlardi. Lekin butunlay ixtiyoriy ham qilib boʻlmaydi — matnsiz
 * tayyorlanadigan narsa qolmaydi, sahifaning butun maʼnosi shu matnda.
 */
export const DISPUTE_NOTE_MIN = 10;
export const DISPUTE_NOTE_MAX = 1000;

export function canSubmitDispute(
  reason: string | null,
  goal: DisputeGoal | null,
  note: string,
): boolean {
  if (reason === null || goal === null) return false;
  return note.trim().length >= DISPUTE_NOTE_MIN;
}

/** Tugma oʻchiq boʻlganda sababini aytadi. Tartib: tur → kutilma → matn. */
export function disputeHint(
  reason: string | null,
  goal: DisputeGoal | null,
  note: string,
): string | null {
  if (reason === null) return 'Muammo turini tanlang';
  if (goal === null) return 'Nimani kutayotganingizni tanlang';
  if (note.trim().length < DISPUTE_NOTE_MIN) return `Kamida ${DISPUTE_NOTE_MIN} belgi yozing`;
  return null;
}

export interface DisputeMessageInput {
  order: LiveOrder;
  /** Formatlanmagan telefon. Boʻsh boʻlsa qator umuman chizilmaydi. */
  phoneNumber: string;
  reason: string;
  goal: DisputeGoal;
  note: string;
}

/**
 * Qoʻllab-quvvatlashga yuboriladigan tayyor matn.
 *
 * Matnga FAQAT haqiqiy maʼlumot kiradi. Ariza raqami, holat, muddat yoki
 * "koʻrib chiqilmoqda" kabi soʻz YOʻQ — ular boʻlmagan jarayonni bor qilib
 * koʻrsatardi.
 *
 * Funksiya determinik: `Date.now()` ham, tasodif ham ishlatilmaydi.
 */
export function buildDisputeMessage(input: DisputeMessageInput): string {
  const { order, phoneNumber, reason, goal, note } = input;

  const details = addressDetailsLine(order.address);
  const address = details ? `${order.address.label} · ${details}` : order.address.label;

  // Yorliq MAʼLUMOTdan olinadi, holatdan emas: yakunlanmagan buyurtmada
  // "Yakunlangan" deb yozish yolgʻon boʻlardi.
  const dateLabel = order.completedAt ? 'Yakunlangan' : 'Buyurtma sanasi';
  /*
   * Sana ATAYLAB mutlaq: "Bugun, 10:55" bir marta yoziladi va matn ichida
   * muzlab qoladi. Foydalanuvchi uni ertaga nusxalasa, operator qaysi kun
   * haqida ekanini bilolmasdi. Ekrandagi yorliq nisbiy qoladi — u har
   * ochilganda qayta hisoblanadi, matn esa yoʻq.
   */
  const stamp = order.completedAt ?? order.createdAt;
  const dateValue = `${formatShortDate(stamp)}, ${formatTime(stamp)}`;

  const lines = [
    'Hizmat24 — muammo haqida xabar',
    '',
    `Buyurtma: ${order.shortId}`,
    `Xizmat: ${order.categoryName}`,
    `${dateLabel}: ${dateValue}`,
    `Usta: ${orEmpty(order.master?.fullName)}`,
    `Summa: ${formatPrice(order.invoice.total)}`,
    `Toʻlov usuli: ${METHOD_LABELS[order.paymentMethod]}`,
    `Manzil: ${address}`,
  ];

  // Boʻsh qiymatda qator UMUMAN chizilmaydi — "—" ham yozilmaydi, chunki
  // bu maʼlumot yoʻqligi emas, kiritilmaganligi.
  if (phoneNumber.trim()) lines.push(`Mening raqamim: ${formatPhone(phoneNumber)}`);

  lines.push('');
  if (order.description.trim()) lines.push(`Soʻralgan ish: ${order.description.trim()}`);
  lines.push(`Muammo: ${reason}`);
  lines.push(`Soʻrov: ${DISPUTE_GOAL_LABELS[goal]}`);
  lines.push('', 'Izoh:', note.trim());

  return lines.join('\n');
}
