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
  buildApplicationMessage,
  EMPTY_MASTER_PROFILE,
  type ApplicationRecord,
  type MasterProfile,
} from '@/lib/masterProfile';
import { isApiEnabled } from '@/api/client';
import { fetchMasterShift, setMasterShift } from '@/api/master';
import { getAccessToken } from '@/api/session';
import type { SupportChannel } from '@/lib/support';
import {
  clearMasterState,
  DECLINED_IDS_MAX,
  loadMasterState,
  saveMasterState,
  type MasterState,
} from './master-persistence';
import { useSessionReady } from './session-ready';
import { useApp } from './store';

/**
 * Usta profili holati.
 *
 * DIQQAT: bu yerda saqlanadigan narsa foydalanuvchining OʻZI AYTGAN
 * maʼlumot va u TAYYORLAGAN ariza matni. Hech qanday ariza hech qayerga
 * yuborilmaydi va "koʻrib chiqilmoqda" degan holat yozilmaydi.
 */
interface MasterContextValue {
  profile: MasterProfile;
  application: ApplicationRecord | null;
  /** Qisman yangilaydi va `updatedAt` ni yozadi. */
  updateProfile: (patch: Partial<MasterProfile>) => void;
  /** Ariza matnini tayyorlaydi (yoki qayta tayyorlaydi). */
  prepareApplication: () => boolean;
  markApplicationChannelOpened: (channel: SupportChannel) => void;
  /** Profil va arizani butunlay oʻchiradi. */
  resetMaster: () => void;
  /** Usta rad etgan buyurtmalar — ular takliflar roʻyxatiga qaytmaydi. */
  declinedOrderIds: readonly string[];
  declineOffer: (orderId: string) => void;
  undeclineOffer: (orderId: string) => void;
  /** Smenani ochadi va boshlanish vaqtini yozadi. */
  openShift: () => void;
  /** Smenani yopadi; boshlanish vaqti tozalanadi. */
  closeShift: () => void;
  /** Soʻrov ketayotgan payt — tugma ikki marta bosilmasin. */
  isShiftPending: boolean;
  /** Oxirgi urinish xatosi; `null` — muammo yoʻq. */
  shiftProblem: string | null;
}

const MasterContext = createContext<MasterContextValue | null>(null);

export function useMaster(): MasterContextValue {
  const value = useContext(MasterContext);
  if (!value) throw new Error('useMaster faqat MasterProvider ichida ishlatiladi');
  return value;
}

const EMPTY_STATE: MasterState = {
  profile: EMPTY_MASTER_PROFILE,
  application: null,
  declinedOrderIds: [],
};

export function MasterProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, fullName, phoneNumber, setMasterTakeover } = useApp();
  const sessionReady = useSessionReady();
  const [state, setState] = useState<MasterState>(() => loadMasterState() ?? EMPTY_STATE);

  useEffect(() => {
    if (!isAuthenticated) {
      clearMasterState();
      return;
    }
    saveMasterState(state);
  }, [state, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) setState(EMPTY_STATE);
  }, [isAuthenticated]);

  const updateProfile = useCallback((patch: Partial<MasterProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...patch, updatedAt: new Date() },
    }));
  }, []);

  /*
   * Matn ARIZA TAYYORLANGAN paytdagi profil va ismdan yigʻiladi va
   * muzlab qoladi. Keyin profil oʻzgarsa, foydalanuvchi qayta tayyorlaydi —
   * eski matn jimgina oʻzgarib ketmaydi.
   */
  const prepareApplication = useCallback((): boolean => {
    let prepared = false;
    setState((prev) => {
      prepared = true;
      return {
        ...prev,
        application: {
          message: buildApplicationMessage({ profile: prev.profile, fullName, phoneNumber }),
          createdAt: new Date(),
          openedChannels: [],
        },
      };
    });
    return prepared;
  }, [fullName, phoneNumber]);

  const markApplicationChannelOpened = useCallback((channel: SupportChannel) => {
    setState((prev) =>
      prev.application
        ? {
            ...prev,
            application: {
              ...prev.application,
              openedChannels: [...prev.application.openedChannels, { channel, openedAt: new Date() }],
            },
          }
        : prev,
    );
  }, []);

  const resetMaster = useCallback(() => setState(EMPTY_STATE), []);

  /*
   * Rad etish buyurtmaga TEGMAYDI: u mijoz dunyosida oʻz holicha qoladi va
   * taymeri yana ishlay boshlaydi. Saqlanadigan yagona narsa — usta buni
   * koʻrmoqchi emasligi.
   */
  const declineOffer = useCallback((orderId: string) => {
    setState((prev) =>
      prev.declinedOrderIds.includes(orderId)
        ? prev
        : {
            ...prev,
            declinedOrderIds: [orderId, ...prev.declinedOrderIds].slice(0, DECLINED_IDS_MAX),
          },
    );
  }, []);

  const undeclineOffer = useCallback((orderId: string) => {
    setState((prev) => ({
      ...prev,
      declinedOrderIds: prev.declinedOrderIds.filter((id) => id !== orderId),
    }));
  }, []);

  /**
   * Smenani yozish.
   *
   * Server ulangan boʻlsa u YAGONA haqiqat manbai: qidiruv `masters.status`
   * ni oʻqiydi va ekrandagi kalit bilan server holati bir xil boʻlishi
   * shart. Shuning uchun ekran avval serverga yozadi, keyin oʻzini
   * yangilaydi — teskarisi boʻlsa, soʻrov yiqilganda kalit «ochiq» deb
   * turib, usta esa ish olmasdi.
   */
  const applyShift = useCallback((isOpen: boolean, since: Date | null) => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        isAvailable: isOpen,
        // Yopiq smenaning davomiyligi degan narsa yoʻq.
        availableSince: isOpen ? (since ?? new Date()) : null,
        updatedAt: new Date(),
      },
    }));
  }, []);

  const [isShiftPending, setIsShiftPending] = useState(false);
  const [shiftProblem, setShiftProblem] = useState<string | null>(null);

  /**
   * Smenani ochish/yopish.
   *
   * Xato JIMGINA yutilmaydi: ilgari `catch` boʻsh edi va tugma bosilgach
   * ekranda hech narsa oʻzgarmasdi — usta tugma buzuq deb oʻylardi.
   */
  const setShift = useCallback(
    (isOpen: boolean) => {
      if (!isApiEnabled()) {
        applyShift(isOpen, isOpen ? new Date() : null);
        return;
      }

      setIsShiftPending(true);
      setShiftProblem(null);

      void setMasterShift(isOpen)
        .then((shift) => {
          applyShift(shift.isOpen, shift.since ? new Date(shift.since) : null);
          setShiftProblem(null);
        })
        .catch((error: unknown) => {
          setShiftProblem(
            error instanceof Error && error.message
              ? error.message
              : 'Smenani oʻzgartirib boʻlmadi — tarmoqni tekshiring',
          );
        })
        .finally(() => setIsShiftPending(false));
    },
    [applyShift],
  );

  const openShift = useCallback(() => setShift(true), [setShift]);
  const closeShift = useCallback(() => setShift(false), [setShift]);

  /*
   * Server ulanganda smena holati UNDAN oʻqiladi: usta boshqa
   * qurilmadan smenani ochgan boʻlishi mumkin va qurilmadagi eski
   * qiymat yolgʻon boʻlardi.
   */
  /*
   * Sessiya tiklanguncha soʻrov YUBORILMAYDI: token hali yoʻq va server
   * 401 qaytarardi — smena holati esa hech qachon oʻqilmasdi.
   */
  useEffect(() => {
    if (!isApiEnabled() || sessionReady === null || !isAuthenticated || !getAccessToken()) return;

    let alive = true;
    void fetchMasterShift()
      .then((shift) => {
        if (alive) applyShift(shift.isOpen, shift.since ? new Date(shift.since) : null);
      })
      .catch(() => {
        // Usta boʻlmagan odamda 404 — bu xato emas, holat.
      });

    return () => {
      alive = false;
    };
  }, [applyShift, sessionReady, isAuthenticated]);

  /*
   * Taymer qorovuli USTA tomonidan yoqiladi, lekin buyurtmalar mijoz
   * storeʼida yashaydi. Shuning uchun bitta hosila yuqoriga uzatiladi:
   * smena ochiq boʻlsa, qidiruvdagi buyurtma mock ustaga berilmaydi —
   * u ustaning kabinetida taklif boʻlib turadi.
   */
  useEffect(() => {
    setMasterTakeover(state.profile.isAvailable);
  }, [state.profile.isAvailable, setMasterTakeover]);

  const value = useMemo<MasterContextValue>(
    () => ({
      profile: state.profile,
      application: state.application,
      updateProfile,
      prepareApplication,
      markApplicationChannelOpened,
      resetMaster,
      declinedOrderIds: state.declinedOrderIds,
      declineOffer,
      undeclineOffer,
      openShift,
      closeShift,
      isShiftPending,
      shiftProblem,
    }),
    [
      state,
      updateProfile,
      prepareApplication,
      markApplicationChannelOpened,
      resetMaster,
      declineOffer,
      undeclineOffer,
      openShift,
      closeShift,
      isShiftPending,
      shiftProblem,
    ],
  );

  return <MasterContext.Provider value={value}>{children}</MasterContext.Provider>;
}
