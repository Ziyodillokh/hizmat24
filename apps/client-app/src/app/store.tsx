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
  setDraftDetails: (description: string, isUrgent: boolean) => void;
  setDraftAddress: (address: OrderAddress) => void;
  resetDraft: () => void;
  /** Qoralamadan buyurtma yaratadi va uning id sini qaytaradi. */
  createOrder: () => string | null;
  cancelOrder: (orderId: string, reason: string) => void;
  confirmMaster: (orderId: string) => void;
  rejectMaster: (orderId: string, note: string) => void;
  rateOrder: (orderId: string, stars: number, comment: string) => void;
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

const TERMINAL: readonly OrderStatus[] = [
  ORDER_STATUS.CLOSED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.SAFETY_FLAGGED,
];

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
      }, step.delayMs);

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

      setDraftDetails: (description, isUrgent) =>
        setState((prev) => ({ ...prev, draft: { ...prev.draft, description, isUrgent } })),

      setDraftAddress: (address) =>
        setState((prev) => ({ ...prev, draft: { ...prev.draft, address } })),

      resetDraft: () => setState((prev) => ({ ...prev, draft: EMPTY_DRAFT })),

      createOrder: () => {
        let createdId: string | null = null;

        setState((prev) => {
          const category = ALL_CATEGORIES.find((item) => item.id === prev.draft.categoryId);
          if (!category || !prev.draft.address) return prev;

          orderCounter += 1;
          createdId = `live-${orderCounter}`;
          const shouldQueue = !prev.draft.isUrgent && orderCounter % 3 === 0;

          const order: LiveOrder = {
            id: createdId,
            shortId: `HZ-${orderCounter}`,
            categoryId: category.id,
            categoryName: category.name,
            categoryIconKey: category.iconKey,
            description: prev.draft.description,
            price: category.basePrice,
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

      rateOrder: (orderId, stars, comment) =>
        patchOrder(orderId, {
          status: ORDER_STATUS.CLOSED,
          rating: { stars, comment: comment || null },
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
