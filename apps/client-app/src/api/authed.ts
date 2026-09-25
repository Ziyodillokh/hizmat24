import { ApiError, apiRequest, type RequestOptions } from './client';
import { getAccessToken, refreshAccessToken } from './session';

/**
 * Tokenli soʻrov — 401 da token BIR MARTA yangilanib, qayta yuboriladi.
 *
 * `access` tokenning umri 15 daqiqa. Usiz ilova ochiq turib 15 daqiqa
 * kutgan foydalanuvchi «usta chaqirish» tugmasini bosganda sababsiz
 * «unauthorized» xatosini koʻrardi — token eskirgan, lekin uni
 * yangilaydigan hech narsa yoʻq edi.
 *
 * Yangilash BIR martalik: ikkinchi 401 — sessiya haqiqatan yaroqsiz va
 * uni cheksiz qaytarish faqat kechikish qoʻshardi. Bu holda xato
 * yuqoriga chiqadi va `AppRouter` foydalanuvchini chiqaradi.
 *
 * Ilgari bu yordamchi toʻrtta modulda NUSXALANGAN edi; biriga
 * qoʻshilgan tuzatish qolganlarida unutilib ketardi.
 */
export async function authed<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await apiRequest<T>(path, { ...options, token: getAccessToken() });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;

    const renewed = await refreshAccessToken();
    if (!renewed) throw error;

    return apiRequest<T>(path, { ...options, token: getAccessToken() });
  }
}
