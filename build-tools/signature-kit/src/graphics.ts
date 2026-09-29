import { mix } from './color.js';
import type { SignatureInput } from './input.js';

/** The colours of one mode a graphic is drawn from. */
export interface GraphicColors {
  bg: string;
  surface: string;
  subtle: string;
  ink: string;
  brand: string;
}

/** A graphic's SVG and the opaque colours text can sit on inside it. */
export interface Graphic {
  svg: string;
  paints: string[];
}

const SVG = 'xmlns="http://www.w3.org/2000/svg"';
const W = 1920;
const H = 1080;

// The overlay strengths per mode; dark canvases need more brand to show the same glow.
const ALPHA = {
  light: { line: 0.06, dot: 0.08, glow: 0.08, tint: 0.05 },
  dark: { line: 0.07, dot: 0.1, glow: 0.12, tint: 0.08 },
} as const;
type Mode = keyof typeof ALPHA;

/** The motif as one pattern tile: its size and its content, drawn in `ink` at alpha. */
function tile(motif: SignatureInput['motif'], ink: string, mode: Mode): { size: number; body: string; alpha: number } {
  const { line, dot } = ALPHA[mode];
  if (motif === 'dots') {
    return { size: 24, alpha: dot, body: `<circle cx="12" cy="12" r="1.2" fill="${ink}" fill-opacity="${dot}"/>` };
  }
  if (motif === 'diagonal') {
    return { size: 16, alpha: line, body: `<path d="M0 16L16 0" stroke="${ink}" stroke-opacity="${line}"/>` };
  }
  return { size: 40, alpha: line, body: `<path d="M40 .5H.5V40" stroke="${ink}" stroke-opacity="${line}"/>` };
}

/** The glow as defs and a body over a 1920×1080 canvas. */
function glowParts(style: SignatureInput['graphics'], brand: string, mode: Mode): { defs: string; body: string } {
  const a = ALPHA[mode].glow;
  if (style === 'sharp') {
    return { defs: '', body: `<path d="M0 0H${W}V380L0 700Z" fill="${brand}" fill-opacity="${a}"/>` };
  }
  return {
    defs:
      `<radialGradient id="glow" cx="${W / 2}" cy="0" r="900" gradientUnits="userSpaceOnUse">` +
      `<stop offset="0" stop-color="${brand}" stop-opacity="${a}"/><stop offset="1" stop-color="${brand}" stop-opacity="0"/>` +
      '</radialGradient>',
    body: `<rect width="${W}" height="${H}" fill="url(#glow)"/>`,
  };
}

/** A surface the consumer stretches over any box (background-size:100% 100%): `base` tinted with the
 *  brand, as a smooth gradient (soft) or a hard diagonal split (sharp). */
function stretched(style: SignatureInput['graphics'], base: string, brand: string, mode: Mode): Graphic {
  const tinted = mix(base, brand, ALPHA[mode].tint);
  const open = `<svg ${SVG} viewBox="0 0 100 100" preserveAspectRatio="none">`;
  const svg =
    style === 'sharp'
      ? `${open}<rect width="100" height="100" fill="${base}"/><path d="M100 0V100H40Z" fill="${tinted}"/></svg>`
      : `${open}<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${base}"/>` +
        `<stop offset="1" stop-color="${tinted}"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/></svg>`;
  return { svg, paints: [base, tinted] };
}

/** Every graphic of one mode: the five layers the theme writes as `--sig-<key>`, and `background`,
 *  the canvas with its glow and grid composed, for surfaces that paint one image. */
export function graphicsFor(input: SignatureInput, c: GraphicColors, mode: Mode): Record<string, Graphic> {
  const t = tile(input.motif, c.ink, mode);
  const g = glowParts(input.graphics, c.brand, mode);
  const glowPaint = mix(c.bg, c.brand, ALPHA[mode].glow);
  const linePaint = mix(c.bg, c.ink, t.alpha);
  return {
    grid: {
      svg: `<svg ${SVG} width="${t.size}" height="${t.size}" viewBox="0 0 ${t.size} ${t.size}" fill="none">${t.body}</svg>`,
      paints: [c.bg, linePaint],
    },
    glow: {
      svg: `<svg ${SVG} width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none"><defs>${g.defs}</defs>${g.body}</svg>`,
      paints: [c.bg, glowPaint],
    },
    band: stretched(input.graphics, c.subtle, c.brand, mode),
    card: stretched(input.graphics, c.surface, c.brand, mode),
    // The panel is a page backdrop (the sign-in page paints it behind its card), so it starts on bg.
    panel: stretched(input.graphics, c.bg, c.brand, mode),
    background: {
      svg:
        `<svg ${SVG} width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none"><defs>${g.defs}` +
        `<pattern id="motif" width="${t.size}" height="${t.size}" patternUnits="userSpaceOnUse">${t.body}</pattern></defs>` +
        `<rect width="${W}" height="${H}" fill="${c.bg}"/>${g.body}<rect width="${W}" height="${H}" fill="url(#motif)"/></svg>`,
      paints: [c.bg, glowPaint, mix(glowPaint, c.ink, t.alpha)],
    },
  };
}

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The mark: the name's initial in `label` on a tile filled with `currentColor`, which the chrome
 *  sets to the accent; no width or height, so CSS sizes it. */
export function markSvg(input: SignatureInput, label: string): string {
  const initial = escapeXml([...input.name][0]!.toUpperCase());
  return (
    `<svg ${SVG} viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="currentColor"/>` +
    `<text x="16" y="16" text-anchor="middle" dominant-baseline="central" font-family="'${input.fonts.display}',sans-serif" ` +
    `font-weight="600" font-size="18" fill="${label}">${initial}</text></svg>`
  );
}

/** The wordmark: the mark in the brand colour beside the name in the display face, per mode. */
export function wordmarkSvg(input: SignatureInput, brand: string, label: string, text: { light: string; dark: string }): string {
  // ponytail: the width assumes an average advance of 0.6em; measure the display face's glyphs if a
  // long or wide name clips.
  const width = 40 + Math.ceil([...input.name].length * 20 * 0.6);
  const mark = markSvg(input, label).replace('fill="currentColor"', `fill="${brand}"`).replace(/^<svg[^>]*>|<\/svg>$/g, '');
  return (
    `<svg ${SVG} viewBox="0 0 ${width} 32" fill="none" overflow="visible" aria-hidden="true">${mark}` +
    `<text x="40" y="23" font-family="'${input.fonts.display}',sans-serif" font-weight="600" font-size="20" ` +
    `letter-spacing="-0.4" style="fill:light-dark(${text.light},${text.dark})">${escapeXml(input.name)}</text></svg>`
  );
}
