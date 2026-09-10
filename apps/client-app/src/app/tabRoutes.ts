import type { TabKey } from '@/components/BottomNav';

/**
 * Tab → marshrut xaritasi.
 *
 * Alohida faylda: `Record<TabKey, string>` boʻlgani uchun `TabKey` oʻzgarishi
 * bu yerni majburan sindiradi, va testda React daraxtini yuklamasdan
 * tekshirish mumkin.
 */
export const TAB_ROUTES: Record<TabKey, string> = {
  home: '/app/home',
  wallet: '/app/wallet',
  orders: '/app/orders',
  chat: '/app/chat',
  profile: '/app/profile',
};
