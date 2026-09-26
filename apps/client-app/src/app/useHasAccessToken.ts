import { useSyncExternalStore } from 'react';
import { getAccessToken, subscribeToAccessToken } from '@/api/session';

/**
 * Tokenning bor-yoʻqligi — REAKTIV.
 *
 * Chiqarish qarori shunga qarab qabul qilinadi. Ilgari token effekt
 * ichida bir marta oʻqilardi va effekt faqat `outcome` yoki
 * `isAuthenticated` oʻzgarganda qayta ishlardi. Sessiya ilova ishlab
 * turganda yoʻqolsa (`outcome` allaqachon `expired` boʻlgan holatda
 * React bir xil qiymatda qayta render qilmaydi) chiqarish UMUMAN
 * ishlamasdi: token yoʻq, lekin ilova «kirgan» koʻrinardi va har bir
 * amal 401 berardi.
 */
export const useHasAccessToken = (): boolean =>
  useSyncExternalStore(
    subscribeToAccessToken,
    () => getAccessToken() !== null,
    () => false,
  );
