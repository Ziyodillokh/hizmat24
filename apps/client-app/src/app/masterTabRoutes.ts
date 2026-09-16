import { ClockCounterClockwise, Money, User, Wrench } from '@phosphor-icons/react';
import type { TabDefinition } from '@/components/BottomNav';

/**
 * Usta rejimining pastki paneli — mijoznikidan MUSTAQIL toʻrtta tab.
 *
 * Alohida faylda: `Record<MasterTabKey, string>` boʻlgani uchun kalit
 * oʻzgarishi bu yerni majburan sindiradi, va testda React daraxtini
 * yuklamasdan tekshirish mumkin.
 *
 * Yorliq «Ishlar», «Buyurtmalar» EMAS: mijoz paneli allaqachon «Buyurtma»
 * soʻziga egalik qiladi va bitta APK ichida ikki bir xil soʻz ikki rejimni
 * bitta qilib koʻrsatardi. Toʻrt yorliq ham ≤ 7 belgi — 360px ekran uchun.
 */
export type MasterTabKey = 'jobs' | 'history' | 'earnings' | 'profile';

export const MASTER_TAB_ROUTES: Record<MasterTabKey, string> = {
  jobs: '/app/master/jobs',
  history: '/app/master/history',
  earnings: '/app/master/earnings',
  profile: '/app/master/profile',
};

export const MASTER_TABS: readonly TabDefinition<MasterTabKey>[] = [
  { key: 'jobs', label: 'Ishlar', icon: Wrench },
  { key: 'history', label: 'Tarix', icon: ClockCounterClockwise },
  { key: 'earnings', label: 'Daromad', icon: Money },
  { key: 'profile', label: 'Profil', icon: User },
];
