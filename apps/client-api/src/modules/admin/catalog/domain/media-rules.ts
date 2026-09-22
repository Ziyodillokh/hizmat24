/**
 * Yuklanadigan fayl qoidalari — SOF mantiq, disksiz va tarmoqsiz.
 *
 * Chegaralar SHU YERDA yashaydi va ular ikki joyda ishlatiladi: server
 * yuklashni rad etadi, panel esa tugmani bosishdan oldin sababini aytadi.
 * Ikki joyda ikki xil son boʻlsa, foydalanuvchi «nega rad etildi»
 * degan savol bilan qolardi.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
/** Video shundan uzun boʻlsa qabul qilinmaydi (soniya). */
export const MAX_VIDEO_SECONDS = 90;
/** Rasm shu kenglikdan kattasi kichraytiriladi — telefon ekraniga yetarli. */
export const IMAGE_MAX_WIDTH = 1600;
/** Bitta xizmatda shuncha fayl: koʻproq karta emas, galereyaga aylanadi. */
export const MAX_MEDIA_PER_CATEGORY = 8;

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const VIDEO_MIME_TYPES = ['video/mp4'] as const;

export type MediaKind = 'IMAGE' | 'VIDEO';

export interface MediaCandidate {
  mimeType: string;
  byteSize: number;
}

export interface MediaVerdict {
  kind: MediaKind;
}

/** Qoida buzilsa oʻzbekcha sabab bilan istisno oʻrniga matn qaytaradi. */
export type MediaCheck = { ok: true; verdict: MediaVerdict } | { ok: false; problem: string };

const megabytes = (bytes: number): string => `${Math.round(bytes / (1024 * 1024))} MB`;

export function checkMedia(file: MediaCandidate): MediaCheck {
  const mime = file.mimeType.toLowerCase().split(';')[0].trim();

  if ((IMAGE_MIME_TYPES as readonly string[]).includes(mime)) {
    return file.byteSize > MAX_IMAGE_BYTES
      ? { ok: false, problem: `Rasm ${megabytes(MAX_IMAGE_BYTES)} dan katta boʻlmasin.` }
      : { ok: true, verdict: { kind: 'IMAGE' } };
  }

  if ((VIDEO_MIME_TYPES as readonly string[]).includes(mime)) {
    return file.byteSize > MAX_VIDEO_BYTES
      ? { ok: false, problem: `Video ${megabytes(MAX_VIDEO_BYTES)} dan katta boʻlmasin.` }
      : { ok: true, verdict: { kind: 'VIDEO' } };
  }

  return {
    ok: false,
    problem: 'Faqat JPEG, PNG, WebP rasm yoki MP4 video qabul qilinadi.',
  };
}

/**
 * Diskdagi fayl nomi — kiritilgan nomdan MUSTAQIL.
 *
 * Foydalanuvchi nomi yoʻlga qoʻshilsa, `../` yoki maxsus belgilar orqali
 * katalogdan chiqib ketish yoʻli ochilardi. Nom butunlay tashlanadi,
 * faqat kengaytma turdan olinadi.
 */
export const mediaFileName = (id: string, kind: MediaKind): string =>
  kind === 'IMAGE' ? `${id}.webp` : `${id}.mp4`;

export const mediaUrl = (fileName: string): string => `/media/${fileName}`;
