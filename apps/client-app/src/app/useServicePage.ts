import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/api/client';
import { fetchServicePage, type ServicePage } from '@/api/servicePage';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; page: ServicePage }
  | { status: 'failed' };

/**
 * Xizmat sahifasining qoʻshimcha bloklari.
 *
 * Server ulanmagan boʻlsa (`API_BASE_URL` boʻsh — mock rejimi) soʻrov
 * umuman yuborilmaydi va ekran oʻzgarmaydi.
 *
 * Xato holati YASHIRILMAYDI: bloklar jimgina yoʻqolsa, foydalanuvchi
 * xizmatda ular umuman yoʻq deb oʻylardi.
 */
export function useServicePage(categoryId: string | null): {
  page: ServicePage | null;
  isFailed: boolean;
  retry: () => void;
} {
  const [state, setState] = useState<State>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!API_BASE_URL || !categoryId) return;

    let cancelled = false;
    setState({ status: 'loading' });

    fetchServicePage(categoryId)
      .then((page) => {
        if (!cancelled) setState({ status: 'ready', page });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'failed' });
      });

    // Ekran almashganda eski soʻrov javobi yangi xizmat ustiga
    // yozilmasligi kerak.
    return () => {
      cancelled = true;
    };
  }, [categoryId, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    page: state.status === 'ready' ? state.page : null,
    isFailed: state.status === 'failed',
    retry,
  };
}
