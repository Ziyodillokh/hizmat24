import { Drop, Pipe, PipeWrench, SquaresFour, Thermometer, ThermometerHot, Toilet, Waves, Wrench } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';

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
  // Guruh — platforma hozircha faqat santexnika (2026-09-13).
  plumber: Drop,

  // Xizmatlar. "Rakovina va smesitel" ostida dush boshi notoʻgʻri edi;
  // Phosphorʼda Faucet glifi yoʻq, shuning uchun tomchi.
  tap: Drop,
  toilet: Toilet,
  drain: Waves,
  heating: Thermometer,
  'plumbing-repair': PipeWrench,
  'water-heater': ThermometerHot,
  pipes: Pipe,
};

/** Nomaʼlum kalit kelsa ham layout buzilmasin — neytral zaxira ikona. */
export const serviceIcon = (iconKey: string): IconGlyph => ICONS[iconKey] ?? Wrench;

/** Gridʼning oxirgi katakchasi — "Barchasi" (06-ekran). */
export const MORE_ICON = SquaresFour;
