import { apiRequest } from './client';
import { getAccessToken } from './session';

export interface MasterService {
  categoryId: string;
  name: string;
  groupName: string | null;
  summary: string | null;
  basePrice: number;
  complexityLevel: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
  /** Usta shu ishni qabul qiladimi. */
  isEnabled: boolean;
  /** Katalogga yangi qoʻshilgan va usta hali javob bermagan xizmat. */
  isNew: boolean;
}

const authed = <T>(path: string, options: Parameters<typeof apiRequest>[1] = {}) =>
  apiRequest<T>(path, { ...options, token: getAccessToken() });

export const fetchMasterServices = (): Promise<MasterService[]> =>
  authed('/api/v1/master/me/services');

/** Yoqilgan xizmatlar roʻyxatini TOʻLIQ almashtiradi. */
export const saveMasterServices = (categoryIds: string[]): Promise<MasterService[]> =>
  authed('/api/v1/master/me/services', { method: 'PUT', body: { categoryIds } });
