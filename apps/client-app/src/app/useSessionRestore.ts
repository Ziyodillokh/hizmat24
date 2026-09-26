import { useCallback, useEffect, useState } from 'react';
import { refreshSession } from '@/api/auth';
import { ApiError, isApiEnabled } from '@/api/client';
import { setAccessToken, setSessionRefresher } from '@/api/session';
import type { SessionOutcome } from '@/lib/sessionGuard';
import { clearAuth, loadAuth, saveAuth } from './auth-persistence';

/**
 * Ilova ochilganda `access` tokenni tiklaydi.
 *
 * `access` xotirada yashaydi, demak har ochilishda u yoʻq. `refresh` esa
 * saqlangan — undan yangi juftlik olinadi.
 *
 * Xatoning IKKI turi ajratiladi va bu muhim:
 *
 * - Server tokenni RAD ETDI → saqlangani oʻchiriladi, foydalanuvchi
 *   qaytadan kiradi. «Ulangan» deb koʻrsatib, keyin har soʻrovda xato
 *   berish eng yomon holat.
 * - Server JAVOB BERMADI (tarmoq) → saqlangan token QOLADI. Bir lahzalik
 *   uzilish uchun odamni chiqarib, qaytadan SMS soʻrash — eng yomon javob.
 *   Ilova fokusga qaytganda qayta urinamiz.
 */
/**
 * Saqlangan tokenni oʻchirish KERAKMI.
 *
 * Faqat server uni ochiq RAD ETGANDA (401). Tarmoq uzilishi, 429 (juda
 * koʻp urinish), 500 yoki 502 — bularning hech biri tokenning
 * yaroqsizligini anglatmaydi. Ilgari xato TURIGA qaralardi va `server`
 * turidagi hamma narsa — jumladan serverning vaqtinchalik nosozligi —
 * yaroqli sessiyani oʻchirib, odamdan qaytadan SMS soʻrardi.
 */
const isRejected = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 401;

export function useSessionRestore(): SessionOutcome {
  const [outcome, setOutcome] = useState<SessionOutcome>('pending');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Server ulanmagan — mahalliy seansning oʻzi haqiqat.
    if (!isApiEnabled()) {
      setOutcome('active');
      return;
    }

    const stored = loadAuth();
    if (!stored) {
      setOutcome('expired');
      return;
    }

    let alive = true;
    setOutcome('pending');

    void refreshSession(stored.refreshToken)
      .then((tokens) => {
        if (!alive) return;
        setAccessToken(tokens.accessToken);
        // Foydalanuvchi maʼlumoti javobda kelmaydi — saqlangani qoladi,
        // faqat tokenlar almashadi (server har yangilashda yangi refresh
        // beradi va eskisini bekor qiladi).
        saveAuth({ ...stored, refreshToken: tokens.refreshToken });
        setOutcome('active');
      })
      .catch((error: unknown) => {
        if (!alive) return;

        setAccessToken(null);

        // Rad etilmagan xato — sessiya baribir yaroqli boʻlishi mumkin.
        if (!isRejected(error)) {
          setOutcome('offline');
          return;
        }

        clearAuth();
        setOutcome('expired');
      });

    return () => {
      alive = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  /*
   * 401 kelganda `api` qatlami shu funksiyani chaqiradi va tokenni
   * yangilaydi. `api` qurilmadagi saqlashni bilmaydi, shuning uchun
   * ishlov shu yerdan — saqlash kaliti bor joydan — ulanadi.
   */
  useEffect(() => {
    setSessionRefresher(async () => {
      const stored = loadAuth();
      if (!stored) return false;

      try {
        const tokens = await refreshSession(stored.refreshToken);
        setAccessToken(tokens.accessToken);
        saveAuth({ ...stored, refreshToken: tokens.refreshToken });
        return true;
      } catch (error: unknown) {
        // Faqat RAD ETILGAN token oʻchiriladi. Tarmoq uzilishi, 429 yoki
        // 500 da saqlangani qoladi va keyin qayta uriniladi.
        if (isRejected(error)) {
          clearAuth();
          setAccessToken(null);
          setOutcome('expired');
        }
        return false;
      }
    });

    return () => setSessionRefresher(null);
  }, []);

  /*
   * Tarmoq tiklanganda oʻzi qayta uriniladi: ilova ochiq turib internet
   * qaytsa, foydalanuvchi uni qoʻlda qayta ishga tushirishi kerak emas.
   */
  useEffect(() => {
    if (outcome !== 'offline') return;

    window.addEventListener('online', retry);
    window.addEventListener('focus', retry);

    return () => {
      window.removeEventListener('online', retry);
      window.removeEventListener('focus', retry);
    };
  }, [outcome, retry]);

  return outcome;
}
