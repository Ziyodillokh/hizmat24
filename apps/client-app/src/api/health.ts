import { apiRequest, ApiError } from './client';

/**
 * Serverning tiriklik tekshiruvi.
 *
 * `/health/live` `api` prefiksidan TASHQARIDA: load balancer va Prometheus
 * uni versiyalangan yoʻlda kutmaydi (serverdagi `bootstrap.ts` shunday
 * sozlangan).
 */
export interface HealthState {
  status: 'ok' | 'offline' | 'not-configured';
  /** Xato boʻlsa — foydalanuvchiga koʻrsatiladigan qisqa sabab. */
  detail: string | null;
}

export async function checkHealth(): Promise<HealthState> {
  try {
    await apiRequest<{ status: string }>('/health/live');
    return { status: 'ok', detail: null };
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'not-configured') {
      return { status: 'not-configured', detail: null };
    }
    return { status: 'offline', detail: error instanceof ApiError ? error.message : null };
  }
}
