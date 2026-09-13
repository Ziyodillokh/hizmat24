import type { LiveOrder } from '@/app/types';
import { formatDateTime } from './formatters';
import { paymentStateFor } from './orderStateMachine';
import { METHOD_LABELS } from './wallet';

/**
 * Chekning bosh gapi — buyurtma HOLATIGA qarab, lekin har doim rost:
 * pul koʻchmagan, onlayn toʻlov ulanmagan, usta qidiruvi qachon boshlanadi.
 */
export interface ReceiptHeadline {
  title: string;
  body: string;
  tone: 'success' | 'warning' | 'neutral';
}

const paymentFactFor = (method: LiveOrder['paymentMethod']): string =>
  method === 'cash'
    ? 'Pul yechilmadi — naqd toʻlov ish yakunlangach ustaga beriladi.'
    : 'Onlayn toʻlov hali ulanmagan — pul yechilmadi.';

export function receiptHeadline(
  order: Pick<LiveOrder, 'status' | 'scheduledAt' | 'paymentMethod'>,
  now: Date,
): ReceiptHeadline {
  const state = paymentStateFor(order.status);
  if (state === 'none') {
    return { title: 'Buyurtma bekor qilindi', body: 'Hech qanday pul yechilmagan.', tone: 'warning' };
  }
  if (state === 'confirm') {
    return { title: 'Ish yakunlandi', body: 'Baholaganingizdan keyin buyurtma yopiladi.', tone: 'success' };
  }
  if (state === 'paid') {
    return { title: 'Toʻlandi', body: `Toʻlov usuli: ${METHOD_LABELS[order.paymentMethod]}.`, tone: 'success' };
  }
  const search =
    order.scheduledAt && order.scheduledAt.getTime() > now.getTime()
      ? `Usta qidiruvi ${formatDateTime(order.scheduledAt, now)} da boshlanadi.`
      : order.status === 'SEARCHING_QUEUED'
        ? 'Buyurtma navbatga qoʻyildi.'
        : 'Usta qidiruvi boshlandi.';
  return { title: 'Buyurtma qabul qilindi', body: `${search} ${paymentFactFor(order.paymentMethod)}`, tone: 'success' };
}
