// Colour arithmetic in sRGB hex. The theme computes OKLCH inside synthesizeRamp but exports only
// the ramp, so the conversion to hex is written out here (Björn Ottosson's OKLab matrices).

export type Rgb = [number, number, number];

export function rgbOf(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function hexOf(rgb: Rgb): string {
  return `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
}

/** `hex` moved toward `toward` by `weight` (0 keeps it, 1 is `toward`): an overlay at that alpha. */
export function mix(hex: string, toward: string, weight: number): string {
  const [a, b] = [rgbOf(hex), rgbOf(toward)];
  return hexOf(a.map((v, i) => v + (b[i]! - v) * weight) as Rgb);
}

export function rgba(hex: string, alpha: number): string {
  return `rgba(${rgbOf(hex).join(',')},${alpha})`;
}

/** An OKLCH colour as hex; a channel outside sRGB is clipped, which low neutral chroma never reaches. */
export function oklchHex(L: number, C: number, H: number): string {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return hexOf(
    linear.map((x) => 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.max(0, x) ** (1 / 2.4) - 0.055)) as Rgb,
  );
}
