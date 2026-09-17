/**
 * Kirish tokenlari — qurilmada.
 *
 * `access` qisqa umrli va faqat XOTIRADA yashaydi: u har 15 daqiqada
 * yangilanadi va uni diskda saqlash foyda bermaydi. `refresh` esa
 * saqlanadi — usiz ilova har ochilganda qaytadan SMS soʻrardi.
 *
 * Sessiya kaliti (`hizmat24:session:v1`) dan ALOHIDA: u mock rejimga ham
 * tegishli, bu esa faqat serverga.
 */
const KEY = 'hizmat24:auth:v1';

export interface StoredAuth {
  refreshToken: string;
  userId: string;
  phoneNumber: string;
}

/** SOF: saqlangan qiymatni tekshiradi; buzuq boʻlsa `null`. */
export function reviveAuth(raw: unknown): StoredAuth | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const value = raw as Partial<StoredAuth>;

  const refreshToken = typeof value.refreshToken === 'string' ? value.refreshToken.trim() : '';
  const userId = typeof value.userId === 'string' ? value.userId.trim() : '';
  const phoneNumber = typeof value.phoneNumber === 'string' ? value.phoneNumber.trim() : '';
  if (refreshToken.length === 0 || userId.length === 0) return null;

  return { refreshToken, userId, phoneNumber };
}

export function loadAuth(): StoredAuth | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? reviveAuth(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveAuth(auth: StoredAuth): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(auth));
  } catch {
    // Kvota toʻlgan boʻlsa ham ilova ishlaydi — faqat qayta kirish soʻraladi.
  }
}

export function clearAuth(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // eʼtiborsiz
  }
}
