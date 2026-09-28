import type { Signature } from '@digitaplatform/theme';
import { GRAPHICS, MONOGRAM_SVG, WORDMARK_SVG } from './assets.js';

export { APPICON_SVG, MONOGRAM_SVG, WORDMARK_SVG, GRAPHICS } from './assets.js';

/**
 * simetrix — the parent brand's FREE signature. simetrix GmbH is the company
 * behind the digita family (digita platform, digita cloud, digita plugins); its
 * surfaces, simetrix.ch first, wear the same colour world, fonts and background
 * vectors as the digita signature and differ only in the mark: the X (the
 * approved vector in assets/simetrix-x-cyan.svg) and the wordmark "simetrix"
 * with the accent on the final x. No dot: the dot is the digita family's
 * separator and the brand handoff rejected it for simetrix.
 * Colour values are the digita signature's (digita/src/index.ts), traced there
 * to the design templates; media live as FILES in assets/ and are inlined at
 * build via src/assets.ts (gen-assets).
 */
export const signature: Signature = {
  id: 'simetrix',
  name: 'simetrix',
  // The family accent, oklch(0.72 0.16 235) in sRGB, anchoring the primary ramp
  // at step 600 as in the digita signature.
  accent: '#00B2F6',
  fonts: {
    display: "'Space Grotesk', sans-serif",
    sans: "'Manrope', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  // The X, painted with the accent by the chrome (currentColor).
  monogram: MONOGRAM_SVG,
  // The X beside "simetrix", accent on the final x, per mode via light-dark().
  wordmark: WORDMARK_SVG,
  colors: {
    bg: { light: '#F5F8FB', dark: '#050B14' },
    surface: { light: '#FFFFFF', dark: '#070E19' },
    surfaceGlass: { light: 'rgba(255,255,255,.72)', dark: 'rgba(7,14,25,.60)' },
    subtle: { light: '#F0F5FA', dark: '#0B1F33' },
    bgHover: { light: 'rgba(14,111,184,.10)', dark: 'rgba(62,123,240,.12)' },
    textMain: { light: '#13283C', dark: '#EAF1F8' },
    textMuted: { light: '#4A6076', dark: '#8FA3B6' },
    border: { light: 'rgba(15,50,90,.10)', dark: 'rgba(255,255,255,.06)' },
    borderStrong: { light: 'rgba(20,60,110,.20)', dark: 'rgba(120,180,240,.25)' },
  },
  graphics: GRAPHICS,
};

export default signature;
