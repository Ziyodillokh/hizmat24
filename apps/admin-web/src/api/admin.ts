import { apiRequest } from './client';

export interface AdminIdentity {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPERADMIN' | 'OPERATOR' | 'MODERATOR';
  /** Server ruxsat bergan boʻlimlar — menyu shundan chiziladi. */
  sections: string[];
  idleTimeoutSeconds: number;
}

export interface PasswordAccepted {
  stage: 'totp';
  challengeToken: string;
  /** Birinchi kirish: autentifikator ilovasiga qoʻshish uchun havola. */
  enrollmentUri: string | null;
}

export interface SignedIn {
  stage: 'ready';
  token: string;
  admin: AdminIdentity;
}

export const loginWithPassword = (email: string, password: string): Promise<PasswordAccepted> =>
  apiRequest('/admin/auth/login', { method: 'POST', body: { email, password } });

export const loginWithTotp = (challengeToken: string, code: string): Promise<SignedIn> =>
  apiRequest('/admin/auth/totp', { method: 'POST', body: { challengeToken, code } });

export const fetchMe = (token: string): Promise<AdminIdentity> =>
  apiRequest('/admin/me', { token });

export const logout = (token: string): Promise<void> =>
  apiRequest('/admin/auth/logout', { method: 'POST', token });

export interface AdminCategory {
  id: string;
  name: string;
  description: string | null;
  groupName: string | null;
  basePrice: number;
  complexityLevel: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
  iconKey: string | null;
  isActive: boolean;
  sortOrder: number;
  masterCount: number;
}

export const fetchCategories = (token: string): Promise<AdminCategory[]> =>
  apiRequest('/admin/catalog/categories', { token });

// ── Usta arizalari (A2) ────────────────────────────────────────────────

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApplicationListItem {
  id: string;
  fullName: string;
  phoneNumber: string;
  profession: string;
  status: ApplicationStatus;
  /** Foydalanuvchining OʻZ daʼvosi — hech kim tekshirmagan. */
  claimsCertificate: boolean;
  createdAt: string;
}

export interface ApplicationDetail extends ApplicationListItem {
  experienceLevel: 'NEW' | 'EXPERIENCED';
  about: string;
  districts: string[];
  workFrom: number;
  workTo: number;
  requestedCategoryIds: string[];
  rejectionReason: string | null;
  reviewedByAdminId: string | null;
  reviewedAt: string | null;
  masterId: string | null;
}

export interface Paginated<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApplicationsQuery {
  status?: ApplicationStatus;
  search?: string;
  page?: number;
}

export function fetchApplications(
  token: string,
  query: ApplicationsQuery,
): Promise<Paginated<ApplicationListItem>> {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.page && query.page > 1) params.set('page', String(query.page));
  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return apiRequest(`/admin/applications${suffix}`, { token });
}

export const fetchApplication = (token: string, id: string): Promise<ApplicationDetail> =>
  apiRequest(`/admin/applications/${id}`, { token });

/**
 * Tasdiqlashda tanlanadigan xizmatlar — `catalog` boʻlimidan ALOHIDA
 * endpoint, chunki moderator katalogga kira olmaydi.
 */
export interface AssignableCategory {
  id: string;
  name: string;
  groupName: string | null;
  complexityLevel: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
}

export const fetchAssignableCategories = (token: string): Promise<AssignableCategory[]> =>
  apiRequest('/admin/applications/categories', { token });

export const approveApplication = (
  token: string,
  id: string,
  categoryIds: string[],
): Promise<ApplicationDetail> =>
  apiRequest(`/admin/applications/${id}/approve`, { method: 'POST', token, body: { categoryIds } });

export const rejectApplication = (
  token: string,
  id: string,
  reason: string,
): Promise<ApplicationDetail> =>
  apiRequest(`/admin/applications/${id}/reject`, { method: 'POST', token, body: { reason } });
