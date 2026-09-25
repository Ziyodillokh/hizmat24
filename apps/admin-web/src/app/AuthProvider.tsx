import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, setUnauthorizedHandler } from '@/api/client';
import { fetchMe, logout as logoutRequest, type AdminIdentity } from '@/api/admin';
import { clearToken, readToken, writeToken } from '@/api/session';

interface AuthValue {
  admin: AdminIdentity | null;
  token: string | null;
  /** Sahifa yangilanganda saqlangan token hali tekshirilmoqda. */
  isRestoring: boolean;
  signIn: (token: string, admin: AdminIdentity) => void;
  signOut: (reason?: SignOutReason) => void;
  /** Nega chiqarib yuborildi — login ekranida shu sabab koʻrsatiladi. */
  signOutReason: SignOutReason | null;
}

export type SignOutReason = 'idle' | 'expired';

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth faqat AuthProvider ichida ishlaydi');
  return value;
}

/**
 * Kim kirganini biladigan yagona joy.
 *
 * Sahifa yangilanganda token `sessionStorage` da qolgan boʻlishi mumkin,
 * lekin u hali HAQIQIYmi — bilinmaydi (server sessiyani bekor qilgan
 * yoki faolsizlikdan oʻldirgan boʻlishi mumkin). Shuning uchun har
 * yuklanishda `GET /admin/me` soʻraladi va faqat javob kelgach panel
 * chiziladi. Aks holda menyu bir soniya koʻrinib, keyin login ekraniga
 * sakrab ketardi.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readToken());
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [isRestoring, setIsRestoring] = useState(() => readToken() !== null);
  const [signOutReason, setSignOutReason] = useState<SignOutReason | null>(null);

  const signIn = useCallback((nextToken: string, nextAdmin: AdminIdentity) => {
    writeToken(nextToken);
    setToken(nextToken);
    setAdmin(nextAdmin);
    setSignOutReason(null);
  }, []);

  const signOut = useCallback(
    (reason?: SignOutReason) => {
      // Serverdagi sessiya ham bekor qilinadi; javob kutilmaydi — chiqish
      // har qanday holatda darhol sodir boʻlishi kerak.
      const current = readToken();
      if (current) void logoutRequest(current).catch(() => undefined);

      clearToken();
      setToken(null);
      setAdmin(null);
      setSignOutReason(reason ?? null);
    },
    [],
  );

  /*
   * Sessiya ish paytida tugasa — darhol chiqarish. Har bir soʻrov
   * `apiRequest` dan oʻtadi, shuning uchun ushlash bitta joyda.
   */
  useEffect(() => {
    setUnauthorizedHandler(() => signOut('expired'));
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    const stored = readToken();
    if (!stored) return;

    let cancelled = false;

    fetchMe(stored)
      .then((identity) => {
        if (cancelled) return;
        setAdmin(identity);
        setIsRestoring(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Tarmoq yoʻq boʻlsa tokenni saqlab qolamiz — ulanish tiklanganda
        // qaytadan urinib koʻriladi. Faqat server RAD ETGANDA chiqariladi.
        if (error instanceof ApiError && error.kind === 'unauthorized') {
          clearToken();
          setToken(null);
          setSignOutReason('expired');
        }
        setIsRestoring(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ admin, token, isRestoring, signIn, signOut, signOutReason }),
    [admin, token, isRestoring, signIn, signOut, signOutReason],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
