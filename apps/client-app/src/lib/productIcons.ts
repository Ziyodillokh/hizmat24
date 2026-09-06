import {
  Bathtub,
  Drop,
  Funnel,
  GridNine,
  HardHat,
  Ladder,
  Lightbulb,
  LineSegments,
  Mountains,
  Package,
  PaintBrush,
  PaintBrushBroad,
  PaintBucket,
  PaintRoller,
  Pipe,
  Plug,
  Plugs,
  Rectangle,
  Rows,
  Ruler,
  Screwdriver,
  Shower,
  SquaresFour,
  Stack,
  Toilet,
  ToggleLeft,
  ToggleRight,
  Toolbox,
  Wrench,
} from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';

/**
 * Mahsulot ikonalari.
 *
 * Backend `iconKey` yuboradi, rasm URL emas — shu tufayli ikona ilova ichida
 * vektor boʻlib qoladi va temaga qarab rangini oʻzgartiradi. Haqiqiy mahsulot
 * fotolari qoʻshilganda bu xarita zaxira sifatida qoladi: fotosi yoʻq
 * mahsulot boʻsh katakcha emas, taniqli belgi bilan chiziladi.
 */
const ICONS: Record<string, IconGlyph> = {
  // Qurilish
  cement: Package,
  board: Rectangle,
  profile: Rows,
  insulation: Stack,
  brick: GridNine,
  sand: Mountains,
  ladder: Ladder,
  // Elektr
  cable: Plugs,
  breaker: ToggleLeft,
  socket: Plug,
  switch: ToggleRight,
  lamp: Lightbulb,
  ledstrip: LineSegments,
  panel: SquaresFour,
  measure: Ruler,
  // Santexnika
  pipe: Pipe,
  faucet: Drop,
  sink: Bathtub,
  shower: Shower,
  filter: Funnel,
  toilet: Toilet,
  // Boʻyoq
  paint: PaintBucket,
  primer: PaintRoller,
  varnish: PaintBrushBroad,
  putty: PaintBucket,
  roller: PaintRoller,
  brush: PaintBrush,
  tape: Ruler,
  // Asboblar
  drill: Wrench,
  screwdriver: Screwdriver,
  grinder: Toolbox,
  wrenchset: Toolbox,
  safety: HardHat,
};

/** Nomaʼlum kalit kelsa ham katakcha boʻsh qolmaydi. */
export const productIcon = (iconKey: string): IconGlyph => ICONS[iconKey] ?? Package;
