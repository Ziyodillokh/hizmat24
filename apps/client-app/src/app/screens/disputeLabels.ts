import type { DisputeChannel } from '@/lib/dispute';

/**
 * Kanal jurnali yorliqlari.
 *
 * Ikkala ekran ham shu jadvaldan oʻqiydi — roʻyxatdagi va tafsilotdagi
 * yozuv bir xil soʻz bilan atalishi shart.
 *
 * "Yuborildi" bu yerda YOʻQ va boʻlmaydi: ilova havola ochilganini biladi,
 * xabar yuborilganini bilmaydi.
 */
export const CHANNEL_OPENED_LABELS: Record<DisputeChannel, string> = {
  telegram: 'Telegram ochildi',
  phone: 'Qoʻngʻiroq qilindi',
};
