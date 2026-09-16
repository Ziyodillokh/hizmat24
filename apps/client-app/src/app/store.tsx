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
import {
  simulationStep,
  simulationTimerKey,
  waitMsFor,
} from '@/lib/orderSimulation';
import { NOTIFICATIONS } from '@/mocks/notifications';
import type { AppNotification, Master, OrderAddress } from '@/mocks/types';

import { buildAcceptPatch, buildStepPatch } from './masterActions';
import { buildNewOrder, DEMO_DRAFT, restoreCounter } from './orderFactory';
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

interface AppState {
  isAuthenticated: boolean;
  phoneNumber: string;
  /**
   * Foydalanuvchi OʻZI kiritgan ism; kiritmagan boʻlsa `null`.
   *
   * Ilgari profil va bosh sahifa mock fayldagi "Jasur" ni koʻrsatardi —
   * foydalanuvchi hech qachon aytmagan ism. Ism boʻsh boʻlishi normal
   * holat va ekranlar unga tayyor.
   */
  fullName: string | null;
  /** Tanishtiruv oqimi tugatilganmi. */
  hasOnboarded: boolean;
  role: UserRole | null;
  draft: OrderDraft;
  orders: LiveOrder[];
  notifications: AppNotification[];
  /**
   * Shu qurilmada usta rejimi ish qabul qilishga tayyormi.
   *
   * `MasterProvider` dan YUQORIGA koʻtarilgan: qidiruvdagi buyurtmaning
   * taymeri shu bayroqqa qarab toʻxtaydi, taymer esa shu yerda yashaydi.
   * Saqlanmaydi — manbai usta profili va u oʻz kalitida saqlanadi.
   */
  masterTakeover: boolean;
}

interface AppActions {
  signIn: (phone: string) => void;
  /** Tanishtiruv yakunlandi va rol tanlandi. FAQAT tanishtiruvda chaqiriladi. */
  completeOnboarding: (role: UserRole) => void;
  /**
   * Rejimni almashtiradi.
   *
   * `completeOnboarding` dan AJRATILDI: rejim almashtirish tanishtiruvni
   * "koʻrilgan" deb belgilamasligi kerak va aksincha.
   */
  setRole: (role: UserRole) => void;
  signOut: () => void;
  /** Boʻsh satr `null` ga aylantiriladi — "ism yoʻq" bitta koʻrinishda. */
  setFullName: (name: string) => void;
  setDraftCategory: (categoryId: string) => void;
  setDraftDetails: (description: string) => void;
  setDraftAddress: (address: OrderAddress) => void;
  /** Sevimli roʻyxatidan tanlangan usta; `null` — tanlov yoʻq. */
  setDraftMaster: (masterId: string | null) => void;
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
  /**
   * Usta taklifni qabul qiladi. `false` — taklif eskirgan (taymer ulgurgan
   * yoki buyurtma bekor qilingan) va hech narsa yozilmadi.
   */
  masterAcceptOrder: (orderId: string, input: { master: Master; etaMinutes: number }) => boolean;
  /**
   * Sinov uchun HAQIQIY buyurtma yaratadi — soxta yozuv emas.
   *
   * `createOrder` quvurining oʻzidan oʻtadi, shuning uchun natija ikkala
   * rejimda ham koʻrinadi va hamyon uni boshqa buyurtmalar kabi sanaydi.
   */
  createDemoOrder: () => string | null;
  setMasterTakeover: (on: boolean) => void;
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

const TERMINAL: readonly OrderStatus[] = [
  ORDER_STATUS.CLOSED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.SAFETY_FLAGGED,
];

export function AppProvider({ children }: { children: ReactNode }) {
  // Boshlangʻich holat qurilmadan tiklanadi — ilova qayta ochilganda
  // foydalanuvchi kirish ekraniga qaytmaydi va buyurtmasini yoʻqotmaydi.
  const [state, setState] = useState<AppState>(() => {
    const restored = loadSession();

    if (!restored) {
      return {
        isAuthenticated: false,
        phoneNumber: '',
        fullName: null,
        hasOnboarded: false,
        role: null,
        draft: EMPTY_DRAFT,
        orders: [],
        notifications: NOTIFICATIONS,
        masterTakeover: false,
      };
    }

    restoreCounter(restored.orders);

    const readIds = new Set(restored.readNotificationIds);

    return {
      isAuthenticated: restored.isAuthenticated,
      phoneNumber: restored.phoneNumber,
      fullName: restored.fullName,
      hasOnboarded: restored.hasOnboarded,
      role: restored.role,
      draft: EMPTY_DRAFT,
      orders: restored.orders,
      notifications: NOTIFICATIONS.map((item) =>
        readIds.has(item.id) ? { ...item, readAt: item.readAt ?? new Date() } : item,
      ),
      // `MasterProvider` birinchi effektida haqiqiy qiymatni yozadi. Boshida
      // `false`: smena ochiqligini BILMASDAN taymerni toʻxtatib qoʻyish
      // mijozni qidiruv ekranida abadiy ushlab turardi.
      masterTakeover: false,
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
  const applyServerStep = useCallback((orderId: string, status: OrderStatus) => {
    // Buyurtma `setState` ichidan oʻqiladi: taymer ishga tushganda tanlangan
    // usta allaqachon yozuvda turgan boʻlishi shart. Qorovul ham shu yerda —
    // kutayotgan eski `setTimeout` usta buyurtmani qabul qilgandan KEYIN ham
    // oʻq uzishi mumkin.
    setState((prev) => {
      const order = prev.orders.find((item) => item.id === orderId);
      if (!order || order.status !== status) return prev;

      const step = simulationStep(order, prev.masterTakeover);
      if (!step) return prev;

      const patch = buildStepPatch(order, step.next, new Date());
      return {
        ...prev,
        orders: prev.orders.map((item) => (item.id === orderId ? { ...item, ...patch } : item)),
      };
    });
  }, []);

  // Har bir aktiv buyurtma uchun keyingi avtomatik oʻtishni rejalashtiramiz.
  // Effekt faqat QOʻSHMAYDI: smena ochilgan zahoti keraksiz boʻlib qolgan
  // taymerlar bekor qilinadi, aks holda 3,5 soniyalik eski taymer ustaning
  // taklifini roʻyxatdan uchirib yuborardi.
  useEffect(() => {
    const wanted = new Map<string, { order: LiveOrder; delayMs: number }>();
    for (const order of state.orders) {
      const step = simulationStep(order, state.masterTakeover);
      if (step) wanted.set(simulationTimerKey(order), { order, delayMs: step.delayMs });
    }

    for (const [key, handle] of [...timers.current]) {
      if (wanted.has(key)) continue;
      window.clearTimeout(handle);
      timers.current.delete(key);
    }

    const now = new Date();
    for (const [key, { order, delayMs }] of wanted) {
      if (timers.current.has(key)) continue;

      const handle = window.setTimeout(() => {
        timers.current.delete(key);
        applyServerStep(order.id, order.status);
      }, waitMsFor(order, delayMs, now));

      timers.current.set(key, handle);
    }
  }, [state.orders, state.masterTakeover, applyServerStep]);

  // Holat oʻzgarganda qurilmaga yoziladi. Qoralama SAQLANMAYDI: u faqat
  // buyurtma berish oqimi davomida yashaydi va yarim toʻldirilgan holda
  // tiklanishi foydalanuvchini chalgʻitardi.
  useEffect(() => {
    saveSession({
      isAuthenticated: state.isAuthenticated,
      phoneNumber: state.phoneNumber,
      fullName: state.fullName,
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
    state.fullName,
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

  /**
   * Buyurtma yaratishning YAGONA yoʻli.
   *
   * `draftOverride` — sinov buyurtmasi uchun tayyor qoralama; `null` boʻlsa
   * foydalanuvchi toʻldirgan qoralama olinadi.
   */
  const createFromDraft = useCallback(
    (draftOverride: OrderDraft | null, discountPercent: number): string | null => {
      let createdId: string | null = null;

      setState((prev) => {
        const order = buildNewOrder(draftOverride ?? prev.draft, discountPercent, new Date());
        if (!order) return prev;

        createdId = order.id;
        return { ...prev, orders: [order, ...prev.orders], draft: EMPTY_DRAFT };
      });

      return createdId;
    },
    [],
  );

  const actions = useMemo<AppActions>(
    () => ({
      signIn: (phone) =>
        setState((prev) => ({ ...prev, isAuthenticated: true, phoneNumber: phone })),
      completeOnboarding: (role) =>
        setState((prev) => ({ ...prev, hasOnboarded: true, role })),

      setRole: (role) => setState((prev) => ({ ...prev, role })),

      signOut: () => {
        clearSession();
        setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          phoneNumber: '',
          fullName: null,
          hasOnboarded: false,
          role: null,
          draft: EMPTY_DRAFT,
          orders: [],
        }));
      },

      setFullName: (name) =>
        setState((prev) => ({ ...prev, fullName: name.trim() || null })),

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

      setDraftMaster: (preferredMasterId) =>
        setState((prev) => ({ ...prev, draft: { ...prev.draft, preferredMasterId } })),

      resetDraft: () => setState((prev) => ({ ...prev, draft: EMPTY_DRAFT })),

      createOrder: (discountPercent) => createFromDraft(null, discountPercent),

      createDemoOrder: () => createFromDraft(DEMO_DRAFT, 0),

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

      // Qorovul `simulationStep` ichida: usta yuritayotgan buyurtmada demo
      // tugmasi holatni uning orqasidan surib yuborardi.
      advanceOrder: (orderId) =>
        setState((prev) => {
          const order = prev.orders.find((item) => item.id === orderId);
          if (!order) return prev;

          const step = simulationStep(order, prev.masterTakeover);
          if (!step) return prev;

          const patch = buildStepPatch(order, step.next, new Date());

          return {
            ...prev,
            orders: prev.orders.map((item) =>
              item.id === orderId ? { ...item, ...patch } : item,
            ),
          };
        }),

      masterAcceptOrder: (orderId, input) => {
        let accepted = false;

        setState((prev) => {
          const order = prev.orders.find((item) => item.id === orderId);
          if (!order) return prev;

          // Holat `setState` ICHIDA qayta tekshiriladi (quruvchining oʻzida):
          // taklif kartasi chizilgandan keyin taymer ulgurgan boʻlishi mumkin.
          const patch = buildAcceptPatch(order, input.master, input.etaMinutes);
          if (!patch) return prev;

          accepted = true;
          return {
            ...prev,
            orders: prev.orders.map((item) =>
              item.id === orderId ? { ...item, ...patch } : item,
            ),
          };
        });

        return accepted;
      },

      setMasterTakeover: (on) =>
        setState((prev) => (prev.masterTakeover === on ? prev : { ...prev, masterTakeover: on })),

      markNotificationsRead: () =>
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((item) => ({
            ...item,
            readAt: item.readAt ?? new Date(),
          })),
        })),
    }),
    [patchOrder, createFromDraft],
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
