import type { Dispatch, SetStateAction } from 'react';
import { EMPTY_DRAFT, type OrderDraft, type PaymentMethod } from './types';
import type { OrderAddress } from '@/mocks/types';

/**
 * Buyurtma qoralamasining amallari — sof holat yozuvlari.
 *
 * `store.tsx` dan ajratildi: fayl 500 qator chegarasiga tiralgan edi. Bu
 * yettita amalning yagona savoli bor — qoralamaning bitta maydonini
 * almashtirish — va ularning hech biri serverga bormaydi: qoralama faqat
 * qurilmada yashaydi, serverga u FAQAT "Ustani chaqirish" bosilganda,
 * bitta soʻrov ichida ketadi.
 */
interface StateWithDraft {
  draft: OrderDraft;
}

export interface DraftActions {
  setDraftCategory: (categoryId: string) => void;
  setDraftDetails: (description: string) => void;
  setDraftAddress: (address: OrderAddress) => void;
  setDraftMaster: (masterId: string | null) => void;
  setDraftSchedule: (scheduledAt: Date | null, isUrgent: boolean) => void;
  setDraftPayment: (method: PaymentMethod) => void;
  resetDraft: () => void;
}

export function buildDraftActions<S extends StateWithDraft>(
  setState: Dispatch<SetStateAction<S>>,
): DraftActions {
  const patch = (next: Partial<OrderDraft>) =>
    setState((prev) => ({ ...prev, draft: { ...prev.draft, ...next } }));

  return {
    setDraftCategory: (categoryId) => patch({ categoryId }),
    setDraftDetails: (description) => patch({ description }),
    setDraftAddress: (address) => patch({ address }),
    setDraftMaster: (preferredMasterId) => patch({ preferredMasterId }),
    // Invariant SHU YERDA saqlanadi: rejalashtirilgan buyurtma shoshilinch
    // boʻlmaydi — aks holda chekda "+20 000 shoshilinch" bilan birga
    // "ertaga 14:00" turardi.
    setDraftSchedule: (scheduledAt, isUrgent) =>
      patch({ scheduledAt, isUrgent: scheduledAt === null && isUrgent }),
    setDraftPayment: (paymentMethod) => patch({ paymentMethod }),
    resetDraft: () => setState((prev) => ({ ...prev, draft: EMPTY_DRAFT })),
  };
}
