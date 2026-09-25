import { authed } from './authed';

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


export const fetchMasterServices = (): Promise<MasterService[]> =>
  authed('/api/v1/master/me/services');

/** Yoqilgan xizmatlar roʻyxatini TOʻLIQ almashtiradi. */
export const saveMasterServices = (categoryIds: string[]): Promise<MasterService[]> =>
  authed('/api/v1/master/me/services', { method: 'PUT', body: { categoryIds } });
