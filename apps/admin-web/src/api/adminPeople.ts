import { apiRequest, queryString } from './client';
import type { OrderStatus } from './admin';

/**
 * Odamlar boʻlimi — mijozlar va ustalar.
 *
 * `admin.ts` dan ajratilgan: u 500 qatordan oshib ketdi va katalog,
 * buyurtmalar, hisobotlar bilan aralashib, kerakli narsani topish
 * qiyinlashdi.
 *
 * Telefon raqami DOIM maskalangan keladi — toʻliq raqamni ochish
 * alohida amal va u serverda auditga yoziladi.
 */

export interface AdminUserRow {
  id: string;
  fullName: string | null;
  /** Roʻyxatda DOIM maskalangan — toʻliq raqam alohida amal bilan ochiladi. */
  phoneMasked: string;
  status: 'ACTIVE' | 'BLOCKED';
  ordersCount: number;
  isMaster: boolean;
  createdAt: string;
}

export interface AdminUserOrderRow {
  id: string;
  shortId: string;
  status: OrderStatus;
  price: number;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUserRow {
  orders: AdminUserOrderRow[];
}

export interface AdminMasterRow {
  id: string;
  fullName: string;
  phoneMasked: string;
  isActive: boolean;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  ratingAvg: number;
  ratingCount: number;
  completedOrdersCount: number;
  cancelledByMasterCount: number;
  /** `null` — usta hali ishlamagan; nol foiz yolgʻon boʻlardi. */
  cancelRatePercent: number | null;
  enabledCategories: number;
  isOnShift: boolean;
}

export const fetchAdminUsers = (token: string, search?: string): Promise<AdminUserRow[]> =>
  apiRequest(`/admin/users${queryString({ search })}`, { token });

export const fetchAdminUser = (token: string, id: string): Promise<AdminUserDetail> =>
  apiRequest(`/admin/users/${id}`, { token });

export const fetchAdminMasters = (token: string, search?: string): Promise<AdminMasterRow[]> =>
  apiRequest(`/admin/masters${queryString({ search })}`, { token });

/** Toʻliq raqamni ochish — har chaqiruv auditga yoziladi. */
/** Ustaning oxirgi ishlari. */
export interface AdminMasterOrderRow {
  id: string;
  shortId: string;
  status: string;
  price: number;
  categoryName: string | null;
  createdAt: string;
}

/** Mijoz qoldirgan baho — matn oʻzgartirilmaydi. */
export interface AdminMasterReview {
  orderShortId: string;
  stars: number;
  comment: string | null;
  tags: string[];
  createdAt: string;
}

/**
 * Ustaning toʻliq kartasi.
 *
 * `hasGovCertificate` — admin TASDIQLAGAN sertifikat.
 * `profile.claimsCertificate` — ustaning DAʼVOSI. Ikkalasi ataylab
 * ajratilgan va ekranda ham ajratib koʻrsatiladi.
 */
export interface AdminMasterDetail {
  id: string;
  fullName: string;
  phoneMasked: string;
  isActive: boolean;
  status: string;
  experienceLevel: string;
  hasGovCertificate: boolean;
  photoUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  completedOrdersCount: number;
  cancelledByMasterCount: number;
  cancelRatePercent: number | null;
  isOnShift: boolean;
  userId: string | null;
  createdAt: string;
  profile: {
    about: string;
    districts: string[];
    workFrom: number;
    workTo: number;
    claimsCertificate: boolean;
    availableSince: string | null;
  } | null;
  categories: string[];
  orders: AdminMasterOrderRow[];
  reviews: AdminMasterReview[];
}

export const fetchMasterDetail = (token: string, masterId: string): Promise<AdminMasterDetail> =>
  apiRequest(`/admin/masters/${masterId}`, { token });

export const revealPhone = (
  token: string,
  kind: 'users' | 'masters',
  id: string,
): Promise<{ phoneNumber: string }> =>
  apiRequest(`/admin/${kind}/${id}/reveal-phone`, { method: 'POST', token });

export const setUserBlocked = (
  token: string,
  id: string,
  blocked: boolean,
  reason: string,
): Promise<AdminUserRow> =>
  apiRequest(`/admin/users/${id}/${blocked ? 'block' : 'unblock'}`, {
    method: 'POST',
    token,
    body: { reason },
  });

export const setMasterBlocked = (
  token: string,
  masterId: string,
  blocked: boolean,
  reason: string,
): Promise<{ id: string; fullName: string; isActive: boolean }> =>
  apiRequest(`/admin/masters/${masterId}/${blocked ? 'block' : 'unblock'}`, {
    method: 'POST',
    token,
    body: { reason },
  });
