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
} from '@/lib/orderSimulation';
import { NOTIFICATIONS } from '@/mocks/notifications';
import type { AppNotification, Master, OrderAddress } from '@/mocks/types';

import { buildStepPatch } from './masterActions';
import { isApiEnabled } from '@/api/client';
import { keepOrdersForMode } from '@/lib/orderList';
import { buildNewOrder, DEMO_DRAFT, restoreCounter } from './orderFactory';
import { buildLocalMasterActions } from './localMasterActions';
import { buildServerOrderActions } from './serverOrderActions';
import { buildServerMasterActions } from './serverMasterActions';
import {
  fromServerMasterActions,
  toMasterJobActions,
  type MasterJobActions,
} from './masterJobActions';
import { useOrderTimers } from './useOrderTimers';
import type { RatingInput } from './types';
import type { PaymentMethod } from './types';
import { buildDraftActions } from './draftActions';
import { EMPTY_DRAFT, type LiveOrder, type OrderDraft, type UserRole } from './types';
import type { AuthSession } from '@/api/auth';
import { logout } from '@/api/auth';
import { setAccessToken } from '@/api/session';
import { clearAuth, loadAuth, saveAuth } from './auth-persistence';
import { clearSession, loadSession, saveSession } from './persistence';

/**
 * Ilova holati — IKKI rejimda bir xil shakl.
 *
 * `VITE_API_URL` berilgan boʻlsa amallar serverga boradi va holatni server
 * hal qiladi. Berilmagan boʻlsa (mock rejim) server oʻtishlari — usta
 * topildi → yoʻlga chiqdi → yetib keldi — TAYMER bilan taqlid qilinadi.
 * Ekranlar ikkisini ajratmaydi: har bir amal `Promise` qaytaradi.
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
  /** Serverdan kelgan sessiya: tokenlar saqlanadi, ism serverdan olinadi. */
  signInWithSession: (session: AuthSession) => void;
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
  setDraftQuantity: (quantity: number) => void;
  setDraftAddress: (address: OrderAddress) => void;
  /** Sevimli roʻyxatidan tanlangan usta; `null` — tanlov yoʻq. */
  setDraftMaster: (masterId: string | null) => void;
  /** Vaqt tanlash: `scheduledAt === null` — imkon qadar tez. */
  setDraftSchedule: (scheduledAt: Date | null, isUrgent: boolean) => void;
  setDraftPayment: (method: PaymentMethod) => void;
  resetDraft: () => void;
  /**
   * Buyurtma yaratadi va uning `id` sini qaytaradi.
   *
   * Server rejimida soʻrov yuboriladi va NARXNI server hisoblaydi —
   * `discountPercent` eʼtiborsiz qoladi. Mock rejimda hammasi shu
   * qurilmada va foiz TASHQARIDAN keladi: daraja mock toʻlovlar bilan
   * birga hisoblanadi, store esa faqat jonli buyurtmalarni koʻradi.
   * Ikkala yoʻl ham `Promise` qaytaradi — ekran ularni ajratmaydi.
   */
  createOrder: (discountPercent: number) => Promise<string | null>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  confirmMaster: (orderId: string) => Promise<void>;
  rejectMaster: (orderId: string, note: string) => Promise<void>;
  /**
   * Baho obyekt sifatida uzatiladi: pozitsion argumentlarda `comment` va
   * `tags` ni almashtirib yuborish oson boʻlardi.
   */
  rateOrder: (orderId: string, rating: RatingInput) => Promise<void>;
  /** Demo: keyingi server oʻtishini kutmasdan darhol bajarish. */
  advanceOrder: (orderId: string) => void;
  /**
   * Usta taklifni qabul qiladi. `false` — taklif eskirgan (taymer ulgurgan
   * yoki buyurtma bekor qilingan) va hech narsa yozilmadi.
   */
  masterAcceptOrder: (orderId: string, input: { master: Master; etaMinutes: number }) => boolean;
  masterDepart: (orderId: string, etaMinutes: number) => void;
  masterArrive: (orderId: string) => void;
  masterCancelOrder: (orderId: string, reason: string) => void;
  masterFinish: (orderId: string, workNote: string) => void;
  /**
   * Sinov uchun HAQIQIY buyurtma yaratadi — soxta yozuv emas.
   *
   * `createOrder` quvurining oʻzidan oʻtadi, shuning uchun natija ikkala
   * rejimda ham koʻrinadi va hamyon uni boshqa buyurtmalar kabi sanaydi.
   */
  createDemoOrder: () => string | null;
  setMasterTakeover: (on: boolean) => void;
  markNotificationsRead: () => void;
  /** Usta amallari — rejimga qarab mahalliy yoki serverga ketadi. */
  masterJobs: MasterJobActions;
  /** Roʻyxatdan bitta buyurtmani olib tashlaydi (usta rad etganda). */
  removeOrder: (orderId: string) => void;
  /** Serverdan kelgan roʻyxat bilan almashtiradi (faqat server rejimida). */
  replaceOrders: (orders: LiveOrder[]) => void;
  /** Bitta buyurtmani qoʻshadi yoki almashtiradi — WebSocket hodisasi uchun. */
  upsertOrder: (order: LiveOrder) => void;
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
      // Server ulangan boʻlsa eski MOCK buyurtmalar tashlanadi: ular
      // qurilmada qolib ketar va bosilganda serverga mock id bilan
      // soʻrov ketardi — javob 404 boʻlib, ekranda sababsiz xato chiqardi.
      orders: keepOrdersForMode(restored.orders, isApiEnabled()),
      notifications: NOTIFICATIONS.map((item) =>
        readIds.has(item.id) ? { ...item, readAt: item.readAt ?? new Date() } : item,
      ),
      // `MasterProvider` birinchi effektida haqiqiy qiymatni yozadi. Boshida
      // `false`: smena ochiqligini BILMASDAN taymerni toʻxtatib qoʻyish
      // mijozni qidiruv ekranida abadiy ushlab turardi.
      masterTakeover: false,
    };
  });

  // Qoralama refʼda ham saqlanadi: server amali uni `setState` ichidan
  // emas, chaqiruv paytida oʻqiydi va eskirgan nusxa yuborilmaydi.
  const draftRef = useRef(state.draft);
  draftRef.current = state.draft;

  /**
   * Bitta buyurtmani roʻyxatga qoʻshadi yoki almashtiradi.
   *
   * Server javobi ham, WebSocket hodisasi ham shu yoʻldan oʻtadi: buyurtma
   * ikki marta qoʻshilmaydi va eski nusxa qolib ketmaydi.
   */
  const upsertOrder = useCallback((order: LiveOrder) => {
    setState((prev) => {
      const exists = prev.orders.some((item) => item.id === order.id);
      return {
        ...prev,
        orders: exists
          ? prev.orders.map((item) => (item.id === order.id ? order : item))
          : [order, ...prev.orders],
      };
    });
  }, []);

  /**
   * Server rejimidagi amallar; mock rejimda `null` — pastdagi har bir amal
   * shu bayroqqa qarab yoʻl tanlaydi.
   */
  const server = useMemo(
    () =>
      isApiEnabled()
        ? buildServerOrderActions({
            upsertOrder,
            resetDraft: () => setState((prev) => ({ ...prev, draft: EMPTY_DRAFT })),
            readDraft: () => draftRef.current,
          })
        : null,
    [upsertOrder],
  );

  const removeOrder = useCallback((orderId: string) => {
    setState((prev) => ({ ...prev, orders: prev.orders.filter((item) => item.id !== orderId) }));
  }, []);

  /** Roʻyxatni serverdan kelgani bilan almashtiradi. */
  const replaceOrders = useCallback(
    (orders: LiveOrder[]) => setState((prev) => ({ ...prev, orders })),
    [],
  );

  const draftActions = useMemo(() => buildDraftActions(setState), []);

  const masterActions = useMemo(() => buildLocalMasterActions(setState), []);

  /**
   * Usta amallari: server ulangan boʻlsa serverga, aks holda shu
   * qurilmada. Ekran farqni bilmaydi — ikkalasi bir xil shaklda.
   */
  const masterJobs = useMemo<MasterJobActions>(
    () =>
      isApiEnabled()
        ? fromServerMasterActions(buildServerMasterActions({ upsertOrder, removeOrder }))
        : toMasterJobActions(masterActions),
    [masterActions, upsertOrder, removeOrder],
  );

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

      const step = simulationStep(order, prev.masterTakeover, isApiEnabled());
      if (!step) return prev;

      const patch = buildStepPatch(order, step.next, new Date());
      return {
        ...prev,
        orders: prev.orders.map((item) => (item.id === orderId ? { ...item, ...patch } : item)),
      };
    });
  }, []);

  useOrderTimers(state.orders, state.masterTakeover, applyServerStep);

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

      /*
       * Server yoʻli. `refresh` tokeni ALOHIDA kalitda saqlanadi: sessiya
       * kaliti mock rejimga ham tegishli, bu esa faqat serverga.
       *
       * Ism serverdan keladi va qurilmadagisidan USTUN: boshqa telefonda
       * oʻzgartirilgan boʻlishi mumkin. Server ism bermasa, qurilmadagisi
       * saqlanib qoladi — foydalanuvchi uni qaytadan yozmasin.
       */
      signInWithSession: (session) => {
        saveAuth({
          refreshToken: session.refreshToken,
          userId: session.user.id,
          phoneNumber: session.user.phoneNumber,
        });
        setAccessToken(session.accessToken);
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          phoneNumber: session.user.phoneNumber,
          fullName: session.user.fullName ?? prev.fullName,
        }));
      },
      completeOnboarding: (role) =>
        setState((prev) => ({ ...prev, hasOnboarded: true, role })),

      setRole: (role) => setState((prev) => ({ ...prev, role })),

      signOut: () => {
        // Serverdagi refresh token ham bekor qilinadi; javob kutilmaydi —
        // chiqish har qanday holatda darhol sodir boʻlishi kerak.
        const stored = loadAuth();
        if (stored) void logout(stored.refreshToken);

        clearSession();
        clearAuth();
        setAccessToken(null);
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

      ...draftActions,

      createOrder: async (discountPercent) =>
        server ? server.createOrder() : createFromDraft(null, discountPercent),

      createDemoOrder: () => createFromDraft(DEMO_DRAFT, 0),

      cancelOrder: async (orderId, reason) => {
        if (server) return server.cancelOrder(orderId, reason);
        patchOrder(orderId, {
          status: ORDER_STATUS.CANCELLED,
          cancelReason: reason,
          cancelledBy: 'CLIENT',
          etaMinutes: null,
        });
      },

      confirmMaster: async (orderId) => {
        if (server) return server.confirmMaster(orderId);
        patchOrder(orderId, { status: ORDER_STATUS.IN_PROGRESS });
      },

      rejectMaster: async (orderId, note) => {
        if (server) return server.rejectMaster(orderId, note);
        patchOrder(orderId, {
          status: ORDER_STATUS.SAFETY_FLAGGED,
          cancelReason: note || null,
          etaMinutes: null,
        });
      },

      rateOrder: async (orderId, rating) => {
        if (server) return server.rateOrder(orderId, rating);
        patchOrder(orderId, {
          status: ORDER_STATUS.CLOSED,
          rating: {
            stars: rating.stars,
            comment: rating.comment.trim() || null,
            tags: [...rating.tags],
          },
        });
      },

      // Qorovul `simulationStep` ichida: usta yuritayotgan buyurtmada demo
      // tugmasi holatni uning orqasidan surib yuborardi.
      advanceOrder: (orderId) =>
        setState((prev) => {
          const order = prev.orders.find((item) => item.id === orderId);
          if (!order) return prev;

          const step = simulationStep(order, prev.masterTakeover, isApiEnabled());
          if (!step) return prev;

          const patch = buildStepPatch(order, step.next, new Date());

          return {
            ...prev,
            orders: prev.orders.map((item) =>
              item.id === orderId ? { ...item, ...patch } : item,
            ),
          };
        }),

      ...masterActions,

      masterJobs,
      replaceOrders,
      upsertOrder,
      removeOrder,

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
    [
      patchOrder,
      createFromDraft,
      draftActions,
      masterActions,
      masterJobs,
      server,
      replaceOrders,
      upsertOrder,
      removeOrder,
    ],
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
