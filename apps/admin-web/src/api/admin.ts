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

/** Rasm xizmat sahifasining qaysi blokida ishlatilishi. */
export type MediaRole = 'GALLERY' | 'BEFORE' | 'AFTER' | 'EQUIPMENT';

export interface AdminMedia {
  id: string;
  kind: MediaKind;
  url: string;
  sortOrder: number;
  isCover: boolean;
  role: MediaRole;
  caption: string | null;
}

export interface ServiceStep {
  title: string;
  description: string;
}

export interface ServiceFaqItem {
  question: string;
  answer: string;
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
  steps: ServiceStep[];
  faq: ServiceFaqItem[];
  requirements: string[];
  highlights: string[];
  warrantyNote: string | null;
  warrantyAmount: number | null;
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

/**
 * Sahifa mazmuni — har bir maydon DOIM yuboriladi.
 *
 * Server PATCH ni qisman qiladi: tushirib qoldirilgan maydon
 * «oʻzgarmasin» degani. Shuning uchun blokni TOZALASH uchun uni boʻsh
 * qilib ataylab yuborish kerak.
 */
export interface CategoryContentInput {
  steps: ServiceStep[];
  faq: ServiceFaqItem[];
  requirements: string[];
  highlights: string[];
  warrantyNote: string;
  warrantyAmount: number;
}

export interface CategoryInput extends CategoryContentInput {
  name: string;
  summary: string;
  details: string;
  includes: string[];
  excludes: string[];
  basePrice: number;
  priceKind: PriceKind;
  /** `null` — vaqt aytilmaydi. Tushirib qoldirilsa eski qiymat qolardi. */
  durationMinutes: number | null;
  /** `null` — guruhdan chiqarish. */
  groupId: string | null;
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

/** Rasmning sahifadagi oʻrni va yorligʻi. */
export const updateMedia = (
  token: string,
  mediaId: string,
  body: { role?: MediaRole; caption?: string },
): Promise<AdminCategory> =>
  apiRequest(`/admin/catalog/media/${mediaId}`, { method: 'PATCH', token, body });

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
// ─────────────────────────────────────── operator boʻlimlari (A3, A4) ──

export type OrderStatus =
  | 'DRAFT'
  | 'SEARCHING'
  | 'SEARCHING_QUEUED'
  | 'ASSIGNED'
  | 'MASTER_EN_ROUTE'
  | 'ARRIVED_PENDING_CONFIRMATION'
  | 'IN_PROGRESS'
  | 'COMPLETED_BY_MASTER'
  | 'RATED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'SAFETY_FLAGGED';

export interface AdminOrderRow {
  id: string;
  shortId: string;
  status: OrderStatus;
  categoryName: string | null;
  clientName: string | null;
  clientPhone: string;
  masterName: string | null;
  price: number;
  isUrgent: boolean;
  /** Server hisoblaydi — panel buni qayta hisoblamaydi. */
  isEscalated: boolean;
  assignmentAttempts: number;
  addressLabel: string | null;
  createdAt: string;
}

export interface AdminOrderTimelineEntry {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  actorType: 'CLIENT' | 'MASTER' | 'ADMIN' | 'SYSTEM';
  reason: string | null;
  createdAt: string;
}

export interface AdminOrderDetail extends AdminOrderRow {
  description: string;
  /** Nechta xuddi shu ish. */
  quantity: number;
  /** Qaysi amal mumkinligini server aytadi — panel qoidani takrorlamaydi. */
  canRequeue: boolean;
  requeueBlockedReason: string | null;
  canCancel: boolean;
  cancelBlockedReason: string | null;
  masterPhone: string | null;
  paymentMethod: string | null;
  workNote: string | null;
  cancelReason: string | null;
  scheduledAt: string | null;
  timeline: AdminOrderTimelineEntry[];
}

export interface AdminOrdersPage {
  items: AdminOrderRow[];
  total: number;
  escalatedCount: number;
}

export interface OrdersQuery extends Record<string, string | number | undefined> {
  status?: OrderStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

const queryString = (query: Record<string, string | number | undefined>): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
};

export const fetchAdminOrders = (token: string, query: OrdersQuery = {}): Promise<AdminOrdersPage> =>
  apiRequest(`/admin/orders${queryString(query)}`, { token });

export const fetchEscalatedOrders = (token: string): Promise<AdminOrderRow[]> =>
  apiRequest('/admin/orders/escalated', { token });

export const fetchAdminOrder = (token: string, id: string): Promise<AdminOrderDetail> =>
  apiRequest(`/admin/orders/${id}`, { token });

export const requeueOrder = (token: string, id: string): Promise<AdminOrderDetail> =>
  apiRequest(`/admin/orders/${id}/requeue`, { method: 'POST', token });

export const cancelAdminOrder = (
  token: string,
  id: string,
  reason: string,
): Promise<AdminOrderDetail> =>
  apiRequest(`/admin/orders/${id}/cancel`, { method: 'POST', token, body: { reason } });

export type SafetyAlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export type SafetyResolution = 'CONFIRMED' | 'FALSE_ALARM' | 'NO_CONTACT';

export interface SafetyAlert {
  id: string;
  status: SafetyAlertStatus;
  orderId: string;
  orderShortId: string;
  clientName: string | null;
  clientPhone: string;
  masterId: string | null;
  masterName: string | null;
  masterPhone: string | null;
  masterIsActive: boolean | null;
  clientNote: string | null;
  resolution: SafetyResolution | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  suggestsBlock: boolean;
}

export interface SafetyAlertsPage {
  items: SafetyAlert[];
  openCount: number;
}

export const fetchSafetyAlerts = (
  token: string,
  status?: SafetyAlertStatus,
): Promise<SafetyAlertsPage> =>
  apiRequest(`/admin/safety-alerts${queryString({ status })}`, { token });

export const resolveSafetyAlert = (
  token: string,
  id: string,
  resolution: SafetyResolution,
  note: string,
): Promise<SafetyAlert> =>
  apiRequest(`/admin/safety-alerts/${id}/resolve`, {
    method: 'POST',
    token,
    body: { resolution, note },
  });

// ───────────────────────────── foydalanuvchilar va hisobotlar (A5, A7) ──

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

export interface AdminStats {
  from: string;
  to: string;
  ordersTotal: number;
  byStatus: { status: OrderStatus; count: number }[];
  byCategory: { name: string; count: number }[];
  cancelReasons: { name: string; count: number }[];
  /** `null` — bu davrda tayinlangan buyurtma yoʻq. */
  avgAssignSeconds: number | null;
  mastersActive: number;
  mastersOnShift: number;
  openProblems: {
    escalatedOrders: number;
    openSafetyAlerts: number;
    pendingApplications: number;
  };
}

export interface AuditRow {
  id: string;
  action: string;
  actorType: 'CLIENT' | 'MASTER' | 'ADMIN' | 'SYSTEM';
  actorId: string | null;
  orderId: string | null;
  metadata: unknown;
  createdAt: string;
}

export const fetchAdminStats = (token: string, from?: string, to?: string): Promise<AdminStats> =>
  apiRequest(`/admin/stats${queryString({ from, to })}`, { token });

export interface AuditFilters extends Record<string, string | number | undefined> {
  action?: string;
  actorType?: string;
  limit?: number;
}

/**
 * Audit CSV — matn sifatida.
 *
 * Oddiy `<a href>` ishlamaydi: soʻrovga `Authorization` sarlavhasi
 * kerak, uni esa havolaga qoʻyib boʻlmaydi. Tokenni URL ga yozish
 * mumkin edi, lekin u brauzer tarixida va serverning kirish
 * jurnalida qolib ketardi.
 */
export async function fetchAuditCsv(token: string, filters: AuditFilters = {}): Promise<string> {
  const response = await fetch(`${resolveBaseUrl() ?? ''}/api/v1/admin/audit.csv${queryString(filters)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new ApiError('server', 'CSV yuklab boʻlmadi', response.status);
  return response.text();
}

export const fetchAudit = (
  token: string,
  filters: AuditFilters = {},
): Promise<{ items: AuditRow[]; total: number }> =>
  apiRequest(`/admin/audit${queryString(filters)}`, { token });

/**
 * Platforma ishlaydigan hudud.
 *
 * Shahar nomi panelga ham, ilovaga ham KODDA yozilmaydi: ikkinchi shahar
 * qoʻshilganda ikkalasi ham qayta yigʻilishi kerak boʻlardi.
 */
export interface ServiceArea {
  id: string;
  cityName: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
}

/** Yuborilmagan maydon serverda TEGILMAYDI — qisman yangilash. */
export interface ServiceAreaInput {
  cityName?: string;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  isActive?: boolean;
}

export const fetchServiceAreas = (token: string): Promise<ServiceArea[]> =>
  apiRequest('/admin/settings/service-areas', { token });

export const updateServiceArea = (
  token: string,
  id: string,
  body: ServiceAreaInput,
): Promise<ServiceArea> =>
  apiRequest(`/admin/settings/service-areas/${id}`, { method: 'PATCH', token, body });

export const mediaSrc = (url: string): string => `${resolveBaseUrl() ?? ''}${url}`;
