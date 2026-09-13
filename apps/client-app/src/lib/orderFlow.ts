import type { OrderDraft } from '@/app/types';
import { formatPercent, formatPrice } from './formatters';
import type { OrderInvoice } from './pricing';
import {
  ADDRESS_LIMIT,
  addressTitle,
  isSameAddress,
  type SavedAddress,
} from './savedAddress';

/**
 * Buyurtma oqimining sof qoidalari — REACT YOʻQ.
 * Ekranlar faqat shu yerdagi qarorlarni chizadi; matnlar bir joyda turadi,
 * shuning uchun toʻlov, tasdiqlash va chek bir xil gapiradi.
 */
export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 2000;

export const ORDER_STEP_ROUTES = {
  services: '/app/services',
  details: '/app/new/details',
  address: '/app/new/address',
  addressNew: '/app/new/address/new',
  schedule: '/app/new/schedule',
  payment: '/app/new/payment',
  confirm: '/app/new/confirm',
} as const;

/** Tugma nega oʻchiq. `null` — hammasi joyida. */
export function descriptionHint(text: string): string | null {
  const length = text.trim().length;
  if (length < DESCRIPTION_MIN) return `Kamida ${DESCRIPTION_MIN} belgi yozing`;
  if (length > DESCRIPTION_MAX) return `Koʻpi bilan ${DESCRIPTION_MAX} belgi`;
  return null;
}

export type MissingStep = 'category' | 'address' | 'payment';

export interface MissingStepInfo {
  key: MissingStep;
  route: string;
  title: string;
  cta: string;
}

/** Birinchi yetishmayotgan qadam; toʻliq qoralamada `null`. Tartib: xizmat → manzil → toʻlov. */
export function firstMissingStep(
  draft: Pick<OrderDraft, 'categoryId' | 'address' | 'paymentMethod'>,
  need: readonly MissingStep[],
): MissingStepInfo | null {
  if (need.includes('category') && !draft.categoryId) {
    return { key: 'category', route: ORDER_STEP_ROUTES.services, title: 'Avval xizmat turini tanlang', cta: 'Xizmat tanlash' };
  }
  if (need.includes('address') && !draft.address) {
    return { key: 'address', route: ORDER_STEP_ROUTES.address, title: 'Manzil kiritilmagan', cta: 'Manzil kiritish' };
  }
  if (need.includes('payment') && !draft.paymentMethod) {
    return { key: 'payment', route: ORDER_STEP_ROUTES.payment, title: 'Toʻlov usuli tanlanmagan', cta: 'Toʻlov usulini tanlash' };
  }
  return null;
}

/** Tasdiqlashdan "Oʻzgartirish" bilan kelinsa qadam yana tasdiqlashga qaytadi. */
export const resolveNextRoute = (defaultRoute: string, returnTo: string | null | undefined): string =>
  returnTo === ORDER_STEP_ROUTES.confirm ? returnTo : defaultRoute;

/** Manzil qadamiga qaytilganda avval tanlangan qator; qoralama boʻsh boʻlsa oxirgi ishlatilgani. */
export function preselectedAddressId(
  list: readonly SavedAddress[],
  current: OrderDraft['address'],
): string | null {
  if (current) return list.find((item) => isSameAddress(item.address, current))?.id ?? null;
  return list[0]?.id ?? null;
}

/** Saqlash kartasi ostidagi izoh — har doim bitta joyda, sakramaydi. */
export function saveOfferHint(input: {
  isValid: boolean;
  isFull: boolean;
  duplicate?: SavedAddress;
}): string {
  if (input.duplicate) return `Allaqachon saqlangan: ${addressTitle(input.duplicate)}`;
  if (input.isFull) return `Roʻyxat toʻlgan (${ADDRESS_LIMIT}/${ADDRESS_LIMIT}) — manzil faqat shu buyurtmada ishlatiladi`;
  if (!input.isValid) return 'Avval manzilni yozing';
  return 'Keyingi buyurtmada bir bosishda tanlaysiz. Faqat shu qurilmada saqlanadi';
}

export interface InvoiceRow {
  key: string;
  label: string;
  value: string;
  tone?: 'success';
}

/** Uch ekran (toʻlov, tasdiqlash, chek) AYNAN bir xil qatorlarni chizadi. */
export function invoiceRows(invoice: OrderInvoice): InvoiceRow[] {
  const rows: InvoiceRow[] = [{ key: 'base', label: 'Xizmat narxi', value: formatPrice(invoice.base) }];
  if (invoice.urgentFee > 0) {
    rows.push({ key: 'urgent', label: 'Shoshilinch yuborish', value: formatPrice(invoice.urgentFee) });
  }
  if (invoice.discount > 0) {
    rows.push({
      key: 'discount',
      label: `Daraja chegirmasi · ${formatPercent(invoice.discountPercent)}`,
      value: `−${formatPrice(invoice.discount)}`,
      tone: 'success',
    });
  }
  rows.push({ key: 'fee', label: 'Xizmat haqi', value: 'Bepul', tone: 'success' });
  return rows;
}
