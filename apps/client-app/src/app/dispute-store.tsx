import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  buildDisputeMessage,
  type DisputeChannel,
  type DisputeGoal,
  type DisputeRecord,
} from '@/lib/dispute';
import { clearDisputes, loadDisputes, saveDisputes } from './dispute-persistence';
import { useApp } from './store';
import type { LiveOrder } from './types';

/**
 * Murojaatlar holati.
 *
 * `AppProvider` ga tiqilmaydi: u allaqachon buyurtma taymerlariga toʻla va
 * har bir shikoyat yozuvi butun buyurtma daraxtini qayta hisoblashga majbur
 * qilardi. Chat provideri bilan bir xil asos.
 *
 * DIQQAT: bu yerda saqlanadigan narsa — foydalanuvchi TAYYORLAGAN matn.
 * Hech qanday ariza hech qayerga yuborilmaydi va "koʻrib chiqilmoqda"
 * degan holat yozilmaydi.
 */
export interface CreateDisputeInput {
  order: LiveOrder;
  /** Foydalanuvchi kiritgan ism; kiritmagan boʻlsa `null`. */
  fullName: string | null;
  /** Formatlanmagan telefon; boʻsh boʻlishi mumkin. */
  phoneNumber: string;
  reason: string;
  goal: DisputeGoal;
  note: string;
}

interface DisputeContextValue {
  /** Eng yangisi birinchi. */
  disputes: DisputeRecord[];
  /** Hali yopilmagan murojaatlar soni — profil qatoridagi ishora uchun. */
  openCount: number;
  findDispute: (id: string) => DisputeRecord | undefined;
  /** Yaratadi va `id` ni qaytaradi — ekran darhol tafsilotga oʻtadi. */
  createDispute: (input: CreateDisputeInput) => string;
  markChannelOpened: (id: string, channel: DisputeChannel) => void;
  setResolved: (id: string, resolved: boolean) => void;
  removeDispute: (id: string) => void;
}

const DisputeContext = createContext<DisputeContextValue | null>(null);

export function useDisputes(): DisputeContextValue {
  const value = useContext(DisputeContext);
  if (!value) throw new Error('useDisputes faqat DisputeProvider ichida ishlatiladi');
  return value;
}

// Tasodif ishlatilmaydi: bir xil sessiyada ketma-ket yaratilgan ikki yozuv
// ham albatta har xil kalit oladi.
let disputeCounter = 0;

export function DisputeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useApp();
  const [disputes, setDisputes] = useState<DisputeRecord[]>(() => loadDisputes() ?? []);

  useEffect(() => {
    if (!isAuthenticated) {
      clearDisputes();
      return;
    }
    saveDisputes(disputes);
  }, [disputes, isAuthenticated]);

  // Maxfiylik talabi, qulaylik emas: keyingi foydalanuvchi oldingisining
  // shikoyatini koʻrmasligi kerak.
  useEffect(() => {
    if (!isAuthenticated) setDisputes([]);
  }, [isAuthenticated]);

  const createDispute = useCallback((input: CreateDisputeInput): string => {
    disputeCounter += 1;
    const id = `d-${Date.now().toString(36)}-${disputeCounter}`;
    const now = new Date();

    const record: DisputeRecord = {
      id,
      orderId: input.order.id,
      orderShortId: input.order.shortId,
      categoryName: input.order.categoryName,
      reason: input.reason,
      goal: input.goal,
      note: input.note.trim(),
      message: buildDisputeMessage({
        order: input.order,
        fullName: input.fullName,
        phoneNumber: input.phoneNumber,
        reason: input.reason,
        goal: input.goal,
        note: input.note,
      }),
      createdAt: now,
      openedChannels: [],
      resolvedAt: null,
    };

    setDisputes((prev) => [record, ...prev]);
    return id;
  }, []);

  const markChannelOpened = useCallback((id: string, channel: DisputeChannel) => {
    setDisputes((prev) =>
      prev.map((item) =>
        item.id === id
          ? // Yangi hodisa QOʻSHILADI: "avval Telegram ochdim, keyin
            // qoʻngʻiroq qildim" tarixi yoʻqolmasin.
            { ...item, openedChannels: [...item.openedChannels, { channel, openedAt: new Date() }] }
          : item,
      ),
    );
  }, []);

  const setResolved = useCallback((id: string, resolved: boolean) => {
    setDisputes((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, resolvedAt: resolved ? new Date() : null } : item,
      ),
    );
  }, []);

  const removeDispute = useCallback((id: string) => {
    setDisputes((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const value = useMemo<DisputeContextValue>(
    () => ({
      disputes,
      openCount: disputes.filter((item) => item.resolvedAt === null).length,
      findDispute: (id) => disputes.find((item) => item.id === id),
      createDispute,
      markChannelOpened,
      setResolved,
      removeDispute,
    }),
    [disputes, createDispute, markChannelOpened, setResolved, removeDispute],
  );

  return <DisputeContext.Provider value={value}>{children}</DisputeContext.Provider>;
}
