import { useEffect, useState } from 'react';
import { refreshSession } from '@/api/auth';
import { isApiEnabled } from '@/api/client';
import { setAccessToken } from '@/api/session';
import { clearAuth, loadAuth, saveAuth } from './auth-persistence';

/**
 * Ilova ochilganda `access` tokenni tiklaydi.
 *
 * `access` xotirada yashaydi, demak har ochilishda u yoʻq. `refresh` esa
 * saqlangan — undan yangi juftlik olinadi. Token eskirgan yoki bekor
 * qilingan boʻlsa, saqlangani oʻchiriladi va foydalanuvchi qaytadan kiradi:
 * «ulangan» deb koʻrsatib, keyin har soʻrovda xato berish eng yomon holat.
 *
 * `null` — tiklash hali tugamadi; `true`/`false` — natija.
 */
export function useSessionRestore(): boolean | null {
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isApiEnabled()) {
      setDone(false);
      return;
    }

    const stored = loadAuth();
    if (!stored) {
      setDone(false);
      return;
    }

    let alive = true;
    void refreshSession(stored.refreshToken)
      .then((session) => {
        if (!alive) return;
        setAccessToken(session.accessToken);
        saveAuth({
          refreshToken: session.refreshToken,
          userId: session.user.id,
          phoneNumber: session.user.phoneNumber,
        });
        setDone(true);
      })
      .catch(() => {
        if (!alive) return;
        clearAuth();
        setAccessToken(null);
        setDone(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return done;
}
