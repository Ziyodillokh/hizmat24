import { AdminRole } from '@prisma/client';

/**
 * Panel boʻlimlari va ularga kim kira oladi — YAGONA manba.
 *
 * Bu roʻyxat ikki joyda ishlatiladi: `AdminGuard` soʻrovni rad etadi va
 * `GET /admin/me` javobida menyuni chizish uchun frontendga yuboriladi.
 * Frontend oʻz nusxasini tutmaydi — aks holda menyuda koʻrinadigan boʻlim
 * ochilganda 403 beradigan holat paydo boʻlardi.
 *
 * Rollar IERARXIYA emas: operator katalogga, moderator buyurtmalarga
 * kirmaydi. Faqat `SUPERADMIN` hamma joyda.
 */
export const ADMIN_SECTIONS = [
  'dashboard',
  'applications',
  'orders',
  'safety',
  'users',
  'catalog',
  'reports',
  'admins',
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];

const SECTION_ROLES: Record<AdminSection, readonly AdminRole[]> = {
  dashboard: [AdminRole.SUPERADMIN, AdminRole.OPERATOR, AdminRole.MODERATOR],
  applications: [AdminRole.SUPERADMIN, AdminRole.MODERATOR],
  orders: [AdminRole.SUPERADMIN, AdminRole.OPERATOR],
  safety: [AdminRole.SUPERADMIN, AdminRole.OPERATOR],
  users: [AdminRole.SUPERADMIN, AdminRole.OPERATOR],
  catalog: [AdminRole.SUPERADMIN],
  reports: [AdminRole.SUPERADMIN, AdminRole.OPERATOR],
  admins: [AdminRole.SUPERADMIN],
};

export const canAccess = (role: AdminRole, section: AdminSection): boolean =>
  SECTION_ROLES[section].includes(role);

/** Shu rol koʻradigan boʻlimlar — menyu shu roʻyxatdan chiziladi. */
export const sectionsFor = (role: AdminRole): AdminSection[] =>
  ADMIN_SECTIONS.filter((section) => canAccess(role, section));
