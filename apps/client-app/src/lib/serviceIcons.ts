import { Armchair, CookingPot, Door, Drop, Fan, Fire, Hammer, Lightbulb, Lightning, PaintBrush, PaintRoller, Plug, Plugs, Shower, SprayBottle, SquaresFour, Thermometer, ThermometerHot, ToggleLeft, Toilet, WashingMachine, Waves, Wrench } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { IconSize } from '@/components/Icon';

/**
 * Server `iconKey` kalitini yuboradi, rasm URL emas (1-boʻlim, 16-qoida).
 * Shu sababli ikona ilova ichida vektor boʻlib qoladi va temaga qarab rangini
 * oʻzgartiradi.
 *
 * Jadvalda HAM guruh, HAM xizmat kalitlari bor: ilgari har bir xizmat oʻz
 * guruhining ikonasini meros qilib olardi va roʻyxatda toʻrtta ketma-ket
 * xizmat bitta bir xil glif bilan chizilardi — hech bir haqiqiy ilova
 * vertikal roʻyxatda bitta gliftni toʻrt marta takrorlamaydi.
 */
const ICONS: Record<string, IconGlyph> = {
  // Guruhlar
  // `Plug` katakchadagi eng yengil glif edi; `Lightning` xizmat turini aniqroq beradi.
  electrician: Lightning,
  plumber: Drop,
  gas: Fire,
  // `Blocks` ilova vidjetiga oʻxshardi, "Texnika" ga emas.
  appliance: WashingMachine,
  carpenter: Hammer,
  painter: PaintRoller,
  // `Sparkles` — sunʼiy intellekt mahsulotlarining eng tanish belgisi.
  cleaning: SprayBottle,

  // Xizmatlar
  socket: Plug,
  lamp: Lightbulb,
  breaker: ToggleLeft,
  rewire: Plugs,
  tap: Shower,
  toilet: Toilet,
  drain: Waves,
  heating: Thermometer,
  stove: CookingPot,
  boiler: ThermometerHot,
  washer: WashingMachine,
  ac: Fan,
  door: Door,
  furniture: Armchair,
  wall: PaintBrush,
  general: SprayBottle,
};

/** Nomaʼlum kalit kelsa ham layout buzilmasin — neytral zaxira ikona. */
export const serviceIcon = (iconKey: string): IconGlyph => ICONS[iconKey] ?? Wrench;

/**
 * Optik massani tenglashtirish: ixcham gliflar kattaroq, keng va zich
 * boʻlganlari kichikroq chiziladi — aks holda katakchalar qatorida baʼzilari
 * "ogʻir", baʼzilari "yengil" boʻlib koʻrinadi.
 */
const ICON_SIZES: Record<string, IconSize> = {
  electrician: 32,
  plumber: 32,
  gas: 32,
  carpenter: 32,
  appliance: 28,
  painter: 28,
  cleaning: 28,
  more: 24,
};

export const serviceIconSize = (iconKey: string): IconSize => ICON_SIZES[iconKey] ?? 28;

/** Gridʼning oxirgi katakchasi — "Barchasi" (06-ekran). */
export const MORE_ICON = SquaresFour;
