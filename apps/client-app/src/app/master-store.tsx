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
import type { SupportChannel } from '@/lib/support';
import {
  clearMasterState,
  DECLINED_IDS_MAX,
  loadMasterState,
  saveMasterState,
  type MasterState,
} from './master-persistence';
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

  const openShift = useCallback(() => {
    const now = new Date();
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, isAvailable: true, availableSince: now, updatedAt: now },
    }));
  }, []);

  const closeShift = useCallback(() => {
    setState((prev) => ({
      ...prev,
      // `availableSince` majburan tozalanadi: yopiq smenaning davomiyligi
      // degan narsa yoʻq va eskirgan vaqt qolsa ekran yolgʻon gapirardi.
      profile: {
        ...prev.profile,
        isAvailable: false,
        availableSince: null,
        updatedAt: new Date(),
      },
    }));
  }, []);

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
    ],
  );

  return <MasterContext.Provider value={value}>{children}</MasterContext.Provider>;
}
