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
  isMasterProfileComplete,
  type ApplicationRecord,
  type MasterProfile,
} from '@/lib/masterProfile';
import type { SupportChannel } from '@/lib/support';
import {
  clearMasterState,
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
  isComplete: boolean;
  application: ApplicationRecord | null;
  /** Qisman yangilaydi va `updatedAt` ni yozadi. */
  updateProfile: (patch: Partial<MasterProfile>) => void;
  /** Ariza matnini tayyorlaydi (yoki qayta tayyorlaydi). Profil toʻliq boʻlmasa `false`. */
  prepareApplication: () => boolean;
  markApplicationChannelOpened: (channel: SupportChannel) => void;
  /** Profil va arizani butunlay oʻchiradi. */
  resetMaster: () => void;
}

const MasterContext = createContext<MasterContextValue | null>(null);

export function useMaster(): MasterContextValue {
  const value = useContext(MasterContext);
  if (!value) throw new Error('useMaster faqat MasterProvider ichida ishlatiladi');
  return value;
}

const EMPTY_STATE: MasterState = { profile: EMPTY_MASTER_PROFILE, application: null };

export function MasterProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, fullName, phoneNumber } = useApp();
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
      if (!isMasterProfileComplete(prev.profile)) return prev;
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

  const value = useMemo<MasterContextValue>(
    () => ({
      profile: state.profile,
      isComplete: isMasterProfileComplete(state.profile),
      application: state.application,
      updateProfile,
      prepareApplication,
      markApplicationChannelOpened,
      resetMaster,
    }),
    [state, updateProfile, prepareApplication, markApplicationChannelOpened, resetMaster],
  );

  return <MasterContext.Provider value={value}>{children}</MasterContext.Provider>;
}
