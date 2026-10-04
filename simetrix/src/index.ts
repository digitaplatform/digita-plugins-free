import type { Signature } from '@digitaplatform/theme';
import { APPICON_SVG, GRAPHICS, MONOGRAM_SVG, WORDMARK_SVG } from './assets.js';

export { APPICON_SVG, MONOGRAM_SVG, WORDMARK_SVG, GRAPHICS } from './assets.js';

/** The company lockup uses the existing design and its operational signature id. */
export const signature: Signature = {
  id: 'simetrix',
  name: 'simplidigita ai',
  family: 'simplidigita',
  // The family accent, oklch(0.72 0.16 235) in sRGB, anchoring the primary ramp
  // at step 600 as in the digita signature.
  accent: '#00B2F6',
  fonts: {
    display: "'Space Grotesk', sans-serif",
    sans: "'Manrope', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  // The compact company mark, painted by the chrome.
  monogram: MONOGRAM_SVG,
  // Word, accent dot, word — the same construction as ProductLockup.
  wordmark: WORDMARK_SVG,
  // The company app icon on its existing navy/cyan tile.
  icon: APPICON_SVG,
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
