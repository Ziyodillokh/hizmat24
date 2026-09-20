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
