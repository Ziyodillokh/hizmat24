/**
 * Sessiya tokeni — `sessionStorage` da.
 *
 * `localStorage` EMAS: u brauzer yopilib ochilganda ham qoladi va admin
 * paneli uchun bu xavf. `sessionStorage` yorliq yopilishi bilan oʻchadi,
 * yaʼni "kompyuterni ochiq qoldirdim" holati qisqaroq yashaydi. Server
 * tomonida ham yarim soatlik faolsizlik chegarasi bor — ikki qatlam.
 */
const TOKEN_KEY = 'hizmat24.admin.token';

/**
 * Xotiradagi nusxa — brauzer saqlashni taqiqlagan holatda (maxfiy oyna,
 * sayt maʼlumotlari bloklangan) panel baribir ishlashi uchun.
 */
let inMemoryToken: string | null = null;

export function readToken(): string | null {
  if (inMemoryToken) return inMemoryToken;

  try {
    inMemoryToken = sessionStorage.getItem(TOKEN_KEY);
    return inMemoryToken;
  } catch {
    return null;
  }
}

export function writeToken(token: string): void {
  inMemoryToken = token;
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Saqlash mumkin emas — sahifa yangilanguncha xotiradagisi yetadi.
  }
}

export function clearToken(): void {
  inMemoryToken = null;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Yozib boʻlmagan joyda oʻchirib ham boʻlmaydi — muammo emas.
  }
}
