/// <reference types="vite/client" />

// Vite statik aktivlarni modul sifatida import qilishga ruxsat beradi
// (`import img from '@/assets/x.jpg'`), lekin TypeScript bu haqda faqat shu
// eʼlon orqali biladi. Usiz `.jpg` importi "modul topilmadi" xatosini beradi.

/**
 * Muhit oʻzgaruvchilari.
 *
 * `VITE_API_URL` boʻsh boʻlsa ilova MOCK rejimda ishlaydi (hozirgidek,
 * localStorage bilan). Toʻldirilsa — serverga boradi. Shu bitta oʻzgaruvchi
 * ulanishni yoqadi va oʻchiradi.
 */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
