/** Rang juftining kontrast nisbati — WCAG 2.1 boʻyicha. */

export type Rgb = readonly [number, number, number];

/** "47 128 200" → [47, 128, 200]. Notoʻgʻri satrda `null`. */
export function parseChannels(raw: string): Rgb | null {
  const parts = raw.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) {
    return null;
  }
  return [parts[0], parts[1], parts[2]];
}

const channelLuminance = (value: number): number => {
  const sRgb = value / 255;
  return sRgb <= 0.03928 ? sRgb / 12.92 : ((sRgb + 0.055) / 1.055) ** 2.4;
};

export const relativeLuminance = ([r, g, b]: Rgb): number =>
  0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
