/**
 * Barcha API javoblari uchun yagona konvert (umumiy talab 1.2):
 * { success, data, error }
 */
export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorBody | null;
}

export const ok = <T>(data: T): ApiResponse<T> => ({ success: true, data, error: null });

export const fail = (error: ApiErrorBody): ApiResponse<never> => ({
  success: false,
  data: null,
  error,
});
