import { ApiError, apiRequest, resolveBaseUrl } from './client';

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

export type PriceKind = 'FIXED' | 'FROM';
export type MediaKind = 'IMAGE' | 'VIDEO';

export interface AdminMedia {
  id: string;
  kind: MediaKind;
  url: string;
  sortOrder: number;
  isCover: boolean;
}

export interface AdminCategory {
  id: string;
  name: string;
  summary: string | null;
  details: string | null;
  includes: string[];
  excludes: string[];
  description: string | null;
  groupId: string | null;
  groupName: string | null;
  basePrice: number;
  priceKind: PriceKind;
  durationMinutes: number | null;
  complexityLevel: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
  iconKey: string | null;
  isActive: boolean;
  sortOrder: number;
  media: AdminMedia[];
  /** Shu ishni YOQIB qoʻygan ustalar soni. */
  masterCount: number;
}

export interface AdminGroup {
  id: string;
  name: string;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
  categoryCount: number;
}

export interface CategoryInput {
  name: string;
  summary?: string;
  details?: string;
  includes?: string[];
  excludes?: string[];
  basePrice: number;
  priceKind?: PriceKind;
  durationMinutes?: number;
  groupId?: string;
  isActive?: boolean;
}

export const fetchCategories = (token: string): Promise<AdminCategory[]> =>
  apiRequest('/admin/catalog/categories', { token });

// ── Usta arizalari (A2) ────────────────────────────────────────────────

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApplicationListItem {
  id: string;
  fullName: string;
  phoneNumber: string;
  /** `null` — soʻralmagan (hamma usta santexnik), «yoʻq» EMAS. */
  profession: string | null;
  status: ApplicationStatus;
  /** Foydalanuvchining OʻZ daʼvosi — hech kim tekshirmagan. `null` — soʻralmagan. */
  claimsCertificate: boolean | null;
  createdAt: string;
}

export interface ApplicationDetail extends ApplicationListItem {
  /** `null` boʻlgan maydon — soʻralmagan savol. */
  experienceLevel: 'NEW' | 'EXPERIENCED' | null;
  about: string | null;
  districts: string[];
  workFrom: number | null;
  workTo: number | null;
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

export const fetchAdminGroups = (token: string): Promise<AdminGroup[]> =>
  apiRequest('/admin/catalog/groups', { token });

export const fetchCategory = (token: string, id: string): Promise<AdminCategory> =>
  apiRequest(`/admin/catalog/categories/${id}`, { token });

export const createCategory = (token: string, body: CategoryInput): Promise<AdminCategory> =>
  apiRequest('/admin/catalog/categories', { method: 'POST', token, body });

export const updateCategory = (
  token: string,
  id: string,
  body: CategoryInput,
): Promise<AdminCategory> =>
  apiRequest(`/admin/catalog/categories/${id}`, { method: 'PATCH', token, body });

export const setCategoryActive = (
  token: string,
  id: string,
  isActive: boolean,
): Promise<AdminCategory> =>
  apiRequest(`/admin/catalog/categories/${id}/${isActive ? 'activate' : 'deactivate'}`, {
    method: 'POST',
    token,
  });

export const setMediaCover = (token: string, mediaId: string): Promise<AdminCategory> =>
  apiRequest(`/admin/catalog/media/${mediaId}/cover`, { method: 'POST', token });

export const deleteMedia = (token: string, mediaId: string): Promise<AdminCategory> =>
  apiRequest(`/admin/catalog/media/${mediaId}`, { method: 'DELETE', token });

/**
 * Fayl yuklash — `apiRequest` dan chetda.
 *
 * Qobiq har doim JSON yuboradi va `Content-Type` ni oʻzi qoʻyadi;
 * `multipart/form-data` da esa chegarani (boundary) brauzer yozishi
 * kerak, shuning uchun sarlavha UMUMAN qoʻyilmaydi.
 */
export async function uploadMedia(
  token: string,
  categoryId: string,
  file: File,
): Promise<AdminCategory> {
  const baseUrl = resolveBaseUrl();
  if (!baseUrl) throw new ApiError('not-configured', 'Server manzili sozlanmagan (VITE_API_URL)');

  const form = new FormData();
  form.append('file', file);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/admin/catalog/categories/${categoryId}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  } catch {
    throw new ApiError('offline', 'Serverga ulanib boʻlmadi — tarmoqni tekshiring');
  }

  const envelope = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: AdminCategory;
    error?: { message?: string };
  } | null;

  if (!response.ok || !envelope?.success || !envelope.data) {
    throw new ApiError(
      response.status === 401 ? 'unauthorized' : 'server',
      envelope?.error?.message ?? 'Faylni yuklab boʻlmadi',
      response.status,
    );
  }

  return envelope.data;
}

/** Media yoʻli serverga nisbatan (`/media/x.webp`) — toʻliq manzilga aylantiradi. */
export const mediaSrc = (url: string): string => `${resolveBaseUrl() ?? ''}${url}`;
