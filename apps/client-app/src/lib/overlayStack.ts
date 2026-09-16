/**
 * Ochiq ustki qatlamlar (Sheet, Modal) steki.
 *
 * Androidʼning apparat «orqaga» tugmasi ochiq varaqni YOPISHI kerak, sahifani
 * almashtirmasligi. Capacitorʼda `backButton` tinglovchilari hammasi birdan
 * ishga tushadi, shuning uchun «kim birinchi javob beradi» degan savol bitta
 * joyda hal qilinadi: sahifa qorovuli avval shu stekni soʻraydi.
 *
 * React YOʻQ: modul darajasidagi oddiy stek, oxirgi ochilgani birinchi
 * yopiladi.
 */
type CloseHandler = () => void;

const stack: CloseHandler[] = [];

/** Qatlam ochilganda chaqiriladi; qaytgan funksiya uni stekdan olib tashlaydi. */
export function registerOverlay(close: CloseHandler): () => void {
  stack.push(close);
  return () => {
    const index = stack.lastIndexOf(close);
    if (index !== -1) stack.splice(index, 1);
  };
}

/** Eng ustki qatlamni yopadi; `false` — ochiq qatlam yoʻq. */
export function closeTopOverlay(): boolean {
  const close = stack.pop();
  if (!close) return false;
  close();
  return true;
}

/** Faqat testlar uchun: stekni tozalaydi. */
export function resetOverlays(): void {
  stack.length = 0;
}

export const openOverlayCount = (): number => stack.length;
