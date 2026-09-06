import {
  Blocks,
  Droplet,
  Flame,
  Hammer,
  MoreHorizontal,
  PaintRoller,
  Plug,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/**
 * Server `iconKey` kalitini yuboradi, rasm URL emas (1-bo'lim, 16-qoida).
 * Shu sababli ikona ilova ichida vektor bo'lib qoladi va temaga qarab rangini
 * o'zgartiradi.
 */
const ICONS: Record<string, LucideIcon> = {
  electrician: Plug,
  plumber: Droplet,
  gas: Flame,
  appliance: Blocks,
  carpenter: Hammer,
  painter: PaintRoller,
  cleaning: Sparkles,
};

/** Noma'lum kalit kelsa ham layout buzilmasin — neytral zaxira ikona. */
export const serviceIcon = (iconKey: string): LucideIcon => ICONS[iconKey] ?? Wrench;

/** Grid'ning oxirgi katakchasi — "Barchasi" (06-ekran). */
export const MORE_ICON = MoreHorizontal;
