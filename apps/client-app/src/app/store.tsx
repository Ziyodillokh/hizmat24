import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ORDER_STATUS, type OrderStatus } from '@/lib/orderStateMachine';
import { MASTERS } from '@/mocks/masters';
import { ALL_CATEGORIES } from '@/mocks/serviceGroups';
import { NOTIFICATIONS } from '@/mocks/notifications';
import type { AppNotification, OrderAddress } from '@/mocks/types';
import { buildInvoice } from '@/lib/pricing';
import type { RatingInput } from './types';
import type { PaymentMethod } from './types';
import { EMPTY_DRAFT, type LiveOrder, type OrderDraft, type UserRole } from './types';
import { clearSession, loadSession, saveSession } from './persistence';

/**
 * Prototip holati.
 *
 * Backend hali ulanmagan, shuning uchun server tomonidagi oʻtishlar
 * (usta topildi → yoʻlga chiqdi → yetib keldi) TAYMER bilan taqlid qilinadi.
 * Mijoz oʻzi boshqaradigan oʻtishlar esa haqiqiy tugmalar orqali boʻladi.
 */

/** Har bir avtomatik oʻtish uchun kutish vaqti (ms) — demo tezligida. */
const SERVER_STEPS: Partial<Record<OrderStatus, { next: OrderStatus; delayMs: number }>> = {
  [ORDER_STATUS.SEARCHING]: { next: ORDER_STATUS.ASSIGNED, delayMs: 3500 },
  [ORDER_STATUS.SEARCHING_QUEUED]: { next: ORDER_STATUS.ASSIGNED, delayMs: 6000 },
  [ORDER_STATUS.ASSIGNED]: { next: ORDER_STATUS.MASTER_EN_ROUTE, delayMs: 5000 },
  [ORDER_STATUS.MASTER_EN_ROUTE]: { next: ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION, delayMs: 6000 },
  [ORDER_STATUS.IN_PROGRESS]: { next: ORDER_STATUS.COMPLETED_BY_MASTER, delayMs: 7000 },
};

interface AppState {
  isAuthenticated: boolean;
  phoneNumber: string;
  /** Tanishtiruv oqimi tugatilganmi. */
  hasOnboarded: boolean;
  role: UserRole | null;
  draft: OrderDraft;
  orders: LiveOrder[];
  notifications: AppNotification[];
}

interface AppActions {
  signIn: (phone: string) => void;
  /** Tanishtiruv yakunlandi va rol tanlandi. */
  completeOnboarding: (role: UserRole) => void;
  signOut: () => void;
  setDraftCategory: (categoryId: string) => void;
  setDraftDetails: (description: string) => void;
  setDraftAddress: (address: OrderAddress) => void;
  /** Vaqt tanlash: `scheduledAt === null` — imkon qadar tez. */
  setDraftSchedule: (scheduledAt: Date | null, isUrgent: boolean) => void;
  setDraftPayment: (method: PaymentMethod) => void;
  resetDraft: () => void;
  /**
   * Qoralamadan buyurtma yaratadi va uning id sini qaytaradi.
   *
   * Chegirma foizi TASHQARIDAN keladi: daraja mock toʻlovlar va jonli
   * buyurtmalar birgalikda hisoblanadi, store esa faqat jonli buyurtmalarni
   * koʻradi. Foiz shu yerda hisoblansa, Bonuslar sahifasi "Kumush · 4%" deb
   * turganda chekda "Bronza · 2%" chiqardi.
   */
  createOrder: (discountPercent: number) => string | null;
  cancelOrder: (orderId: string, reason: string) => void;
  confirmMaster: (orderId: string) => void;
  rejectMaster: (orderId: string, note: string) => void;
  /**
   * Baho obyekt sifatida uzatiladi: pozitsion argumentlarda `comment` va
   * `tags` ni almashtirib yuborish oson boʻlardi.
   */
  rateOrder: (orderId: string, rating: RatingInput) => void;
  /** Demo: keyingi server oʻtishini kutmasdan darhol bajarish. */
  advanceOrder: (orderId: string) => void;
  markNotificationsRead: () => void;
}

interface AppContextValue extends AppState, AppActions {
  activeOrder: LiveOrder | null;
  unreadCount: number;
  findOrder: (orderId: string) => LiveOrder | undefined;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp faqat AppProvider ichida ishlatiladi');
  return value;
}

let orderCounter = 104_900;

/**
 * Hisoblagichni saqlangan buyurtmalardan tiklaydi.
 *
 * Usiz ilova har qayta ochilganda 104_900 dan boshlanardi, tiklangan
 * buyurtmalar esa eski raqamlarini saqlab qolardi — natijada IKKI xil
 * buyurtma bir xil `id` oladi. Keyin `patchOrder` ikkalasini birdan
 * oʻzgartiradi, hamyon esa bitta toʻlovni ikki marta sanaydi.
 */
function restoreCounter(orders: readonly LiveOrder[]): void {
  for (const order of orders) {
    const digits = Number.parseInt(order.shortId.replace(/\D/g, ''), 10);
    if (Number.isFinite(digits) && digits > orderCounter) orderCounter = digits;
  }
}

const TERMINAL: readonly OrderStatus[] = [
  ORDER_STATUS.CLOSED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.SAFETY_FLAGGED,
];

/**
 * Keyingi avtomatik oʻtishgacha kutish vaqti.
 *
 * Rejalashtirilgan buyurtmada usta qidiruvi belgilangan vaqtda boshlanadi.
 * Busiz kelasi haftaga yozilgan buyurtmada ham 3,5 soniyadan keyin "Usta
 * topildi" chiqardi — bu ekranda koʻrinadigan yolgʻon. Faqat BIRINCHI qadam
 * suriladi, keyingilari odatdagi tezlikda ketadi.
 *
 * 7 kun = 604 800 000 ms; `setTimeout` chegarasi 2 147 483 647 ms.
 */
function waitMsFor(order: LiveOrder, delayMs: number): number {
  const isSearching =
    order.status === ORDER_STATUS.SEARCHING || order.status === ORDER_STATUS.SEARCHING_QUEUED;
  if (!isSearching || !order.scheduledAt) return delayMs;

  return Math.max(0, order.scheduledAt.getTime() - Date.now()) + delayMs;
}

/** Usta tayinlanganda telefon koʻrinadi; boshqa holatlarda `null` boʻladi. */
const assignMaster = () => ({ ...MASTERS.akmal });

export function AppProvider({ children }: { children: ReactNode }) {
  // Boshlangʻich holat qurilmadan tiklanadi — ilova qayta ochilganda
  // foydalanuvchi kirish ekraniga qaytmaydi va buyurtmasini yoʻqotmaydi.
  const [state, setState] = useState<AppState>(() => {
    const restored = loadSession();

    if (!restored) {
      return {
        isAuthenticated: false,
        phoneNumber: '',
        hasOnboarded: false,
        role: null,
        draft: EMPTY_DRAFT,
        orders: [],
        notifications: NOTIFICATIONS,
      };
    }

    restoreCounter(restored.orders);

    const readIds = new Set(restored.readNotificationIds);

    return {
      isAuthenticated: restored.isAuthenticated,
      phoneNumber: restored.phoneNumber,
      hasOnboarded: restored.hasOnboarded,
      role: restored.role,
      draft: EMPTY_DRAFT,
      orders: restored.orders,
      notifications: NOTIFICATIONS.map((item) =>
        readIds.has(item.id) ? { ...item, readAt: item.readAt ?? new Date() } : item,
      ),
    };
  });

  const timers = useRef(new Map<string, number>());

  const patchOrder = useCallback((orderId: string, patch: Partial<LiveOrder>) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.id === orderId ? { ...order, ...patch } : order,
      ),
    }));
  }, []);

  /** Server tomonidagi keyingi oʻtishni qoʻllaydi. */
  const applyServerStep = useCallback(
    (orderId: string, status: OrderStatus) => {
      const step = SERVER_STEPS[status];
      if (!step) return;

      const patch: Partial<LiveOrder> = { status: step.next };
      if (step.next === ORDER_STATUS.ASSIGNED) {
        patch.master = assignMaster();
        patch.etaMinutes = 15;
      }
      if (step.next === ORDER_STATUS.COMPLETED_BY_MASTER) {
        patch.completedAt = new Date();
        patch.etaMinutes = null;
      }

      patchOrder(orderId, patch);
    },
    [patchOrder],
  );

  // Har bir aktiv buyurtma uchun keyingi avtomatik oʻtishni rejalashtiramiz.
  useEffect(() => {
    const active = state.orders.filter((order) => SERVER_STEPS[order.status]);

    for (const order of active) {
      const key = `${order.id}:${order.status}`;
      if (timers.current.has(key)) continue;

      const step = SERVER_STEPS[order.status];
      if (!step) continue;

      const handle = window.setTimeout(() => {
        timers.current.delete(key);
        applyServerStep(order.id, order.status);
      }, waitMsFor(order, step.delayMs));

      timers.current.set(key, handle);
    }
  }, [state.orders, applyServerStep]);

  // Holat oʻzgarganda qurilmaga yoziladi. Qoralama SAQLANMAYDI: u faqat
  // buyurtma berish oqimi davomida yashaydi va yarim toʻldirilgan holda
  // tiklanishi foydalanuvchini chalgʻitardi.
  useEffect(() => {
    saveSession({
      isAuthenticated: state.isAuthenticated,
      phoneNumber: state.phoneNumber,
      hasOnboarded: state.hasOnboarded,
      role: state.role,
      orders: state.orders,
      readNotificationIds: state.notifications
        .filter((item) => item.readAt !== null)
        .map((item) => item.id),
    });
  }, [
    state.isAuthenticated,
    state.phoneNumber,
    state.hasOnboarded,
    state.role,
    state.orders,
    state.notifications,
  ]);

  // Komponent yoʻq qilinganda barcha taymerlar tozalanadi.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((handle) => window.clearTimeout(handle));
      pending.clear();
    };
  }, []);

  const actions = useMemo<AppActions>(
    () => ({
      signIn: (phone) =>
        setState((prev) => ({ ...prev, isAuthenticated: true, phoneNumber: phone })),
      completeOnboarding: (role) =>
        setState((prev) => ({ ...prev, hasOnboarded: true, role })),

      signOut: () => {
        clearSession();
        setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          phoneNumber: '',
          hasOnboarded: false,
          role: null,
          draft: EMPTY_DRAFT,
          orders: [],
        }));
      },

      setDraftCategory: (categoryId) =>
        setState((prev) => ({ ...prev, draft: { ...prev.draft, categoryId } })),

      setDraftDetails: (description) =>
        setState((prev) => ({ ...prev, draft: { ...prev.draft, description } })),

      setDraftSchedule: (scheduledAt, isUrgent) =>
        setState((prev) => ({
          ...prev,
          // Invariant SHU YERDA saqlanadi: rejalashtirilgan buyurtma
          // shoshilinch boʻlmaydi.
          draft: { ...prev.draft, scheduledAt, isUrgent: scheduledAt === null && isUrgent },
        })),

      setDraftPayment: (paymentMethod) =>
        setState((prev) => ({ ...prev, draft: { ...prev.draft, paymentMethod } })),

      setDraftAddress: (address) =>
        setState((prev) => ({ ...prev, draft: { ...prev.draft, address } })),

      resetDraft: () => setState((prev) => ({ ...prev, draft: EMPTY_DRAFT })),

      createOrder: (discountPercent) => {
        let createdId: string | null = null;

        setState((prev) => {
          const category = ALL_CATEGORIES.find((item) => item.id === prev.draft.categoryId);
          // Toʻlov usuli ham majburiy: usulsiz buyurtma hamyonda yorliqsiz
          // qator berardi.
          if (!category || !prev.draft.address || !prev.draft.paymentMethod) return prev;

          orderCounter += 1;
          createdId = `live-${orderCounter}`;
          // Rejalashtirilgan buyurtmada navbat maʼnosiz — navbat "hozir"
          // tushunchasi.
          const shouldQueue =
            !prev.draft.isUrgent && prev.draft.scheduledAt === null && orderCounter % 3 === 0;

          const order: LiveOrder = {
            id: createdId,
            shortId: `HZ-${orderCounter}`,
            categoryId: category.id,
            categoryName: category.name,
            categoryIconKey: category.iconKey,
            description: prev.draft.description,
            invoice: buildInvoice({
              base: category.basePrice,
              isUrgent: prev.draft.isUrgent,
              discountPercent,
            }),
            paymentMethod: prev.draft.paymentMethod,
            scheduledAt: prev.draft.scheduledAt,
            isUrgent: prev.draft.isUrgent,
            address: prev.draft.address,
            // Har uchinchi oddiy buyurtma navbatdan boshlanadi — haqiqiy
            // tizimda ustalar band boʻlganda shunday boʻladi. Shoshilinch
            // buyurtma navbatni chetlab oʻtadi (TZ 3.4).
            status: shouldQueue ? ORDER_STATUS.SEARCHING_QUEUED : ORDER_STATUS.SEARCHING,
            master: null,
            etaMinutes: null,
            queuePosition: shouldQueue ? 3 : null,
            createdAt: new Date(),
            completedAt: null,
            cancelReason: null,
            cancelledBy: null,
            rating: null,
          };

          return { ...prev, orders: [order, ...prev.orders], draft: EMPTY_DRAFT };
        });

        return createdId;
      },

      cancelOrder: (orderId, reason) =>
        patchOrder(orderId, {
          status: ORDER_STATUS.CANCELLED,
          cancelReason: reason,
          cancelledBy: 'CLIENT',
          etaMinutes: null,
        }),

      confirmMaster: (orderId) => patchOrder(orderId, { status: ORDER_STATUS.IN_PROGRESS }),

      rejectMaster: (orderId, note) =>
        patchOrder(orderId, {
          status: ORDER_STATUS.SAFETY_FLAGGED,
          cancelReason: note || null,
          etaMinutes: null,
        }),

      rateOrder: (orderId, rating) =>
        patchOrder(orderId, {
          status: ORDER_STATUS.CLOSED,
          rating: {
            stars: rating.stars,
            comment: rating.comment.trim() || null,
            tags: [...rating.tags],
          },
        }),

      advanceOrder: (orderId) =>
        setState((prev) => {
          const order = prev.orders.find((item) => item.id === orderId);
          if (!order) return prev;

          const step = SERVER_STEPS[order.status];
          if (!step) return prev;

          const patch: Partial<LiveOrder> = { status: step.next };
          if (step.next === ORDER_STATUS.ASSIGNED) {
            patch.master = assignMaster();
            patch.etaMinutes = 15;
          }
          if (step.next === ORDER_STATUS.COMPLETED_BY_MASTER) {
            patch.completedAt = new Date();
            patch.etaMinutes = null;
          }

          return {
            ...prev,
            orders: prev.orders.map((item) =>
              item.id === orderId ? { ...item, ...patch } : item,
            ),
          };
        }),

      markNotificationsRead: () =>
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((item) => ({
            ...item,
            readAt: item.readAt ?? new Date(),
          })),
        })),
    }),
    [patchOrder],
  );

  const value = useMemo<AppContextValue>(() => {
    const activeOrder = state.orders.find((order) => !TERMINAL.includes(order.status)) ?? null;

    return {
      ...state,
      ...actions,
      activeOrder,
      unreadCount: state.notifications.filter((item) => item.readAt === null).length,
      findOrder: (orderId) => state.orders.find((order) => order.id === orderId),
    };
  }, [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
