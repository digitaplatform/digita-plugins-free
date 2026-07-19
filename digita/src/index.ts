import type { Signature } from '@digitaplatform/theme';
import { GRAPHICS, MONOGRAM_SVG, WORDMARK_SVG } from './assets.js';

export {
  APPICON_SVG,
  MONOGRAM_SVG,
  WORDMARK_SVG,
  GRAPHICS,
  GOOGLE_FONTS_URL,
  GOOGLE_FONTS_LINKS,
} from './assets.js';

/**
 * digita — the platform's own FREE signature (the default identity), taken
 * 1:1 from the digitacloud.app design templates (the digita brand source of
 * truth). Every value below traces to
 * digita-websites/claude-design-templates/digitacloud.app.dc.html (dark) and
 * "digitacloud.app light.dc.html" (light); the card layer to the sibling
 * digitaplatform.com templates (digitacloud.app has no card tile of its own).
 * Media (app icon, wordmark, background layers, fonts) live as FILES in
 * assets/ and are inlined at build via src/assets.ts (gen-assets).
 */
export const signature: Signature = {
  id: 'digita',
  name: 'Digita',
  // The template's accent prop is oklch(0.72 0.16 235) (dark template default,
  // digitacloud.app.dc.html:234). synthesizeRamp needs a 6-digit hex and puts
  // it verbatim at step 600, scaling the whole ramp's chroma by the anchor's —
  // so the anchor itself must carry the accent, not the hero cyan #8FDBFF
  // (L .855, C .09: it would wash the ramp out and land an illegible 600).
  // #00B2F6 IS oklch(0.72 0.16 235) in sRGB (CSS gamut mapping: chroma reduced
  // .16→.1528 at constant L/H — what a browser renders for the template value).
  // The hero cyan #8FDBFF stays where the template puts it: the graphics/glow
  // layer, the monogram/wordmark art, the dot glow.
  accent: '#00B2F6',
  // The exact template stacks (digitacloud.app.dc.html:23 body 'Manrope';
  // display 'Space Grotesk' e.g. :33/:51; mono 'JetBrains Mono' e.g. :52).
  fonts: {
    display: "'Space Grotesk', sans-serif",
    sans: "'Manrope', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  // The REAL app icon (assets/digita-cloud-appicon.svg — the ring+dot mark on
  // the navy tile), inlined self-contained with its own brand colours.
  monogram: MONOGRAM_SVG,
  // The "digita●cloud" lockup (assets/digita-cloud-wordmark.svg): Space
  // Grotesk 600, letter-spacing -.03em, the accent dot with the 0 0 8px glow —
  // per-mode exact via light-dark() (template :33 dark / light :33).
  wordmark: WORDMARK_SVG,
  colors: {
    // Canvas: html/body background (light :15 / dark :15).
    bg: { light: '#F5F8FB', dark: '#050B14' },
    // Raised surface: the hero/FQDN card (light :64 #FFFFFF / dark :64 #070E19).
    surface: { light: '#FFFFFF', dark: '#070E19' },
    // Glass = the surface at the established alphas (no glass in the template;
    // dark base re-derived from the REAL surface #070E19).
    surfaceGlass: { light: 'rgba(255,255,255,.72)', dark: 'rgba(7,14,25,.60)' },
    // Soft/recessed fill: the portal table header #F0F5FA (:136, both modes'
    // mock); dark = the brand tile gradient's deep navy end #0B1F33 (:32).
    subtle: { light: '#F0F5FA', dark: '#0B1F33' },
    // Hover/active fill: the mock sidebar's active row rgba(14,111,184,.10)
    // (:100); dark = the hero badge fill rgba(62,123,240,.12) (dark :50).
    bgHover: { light: 'rgba(14,111,184,.10)', dark: 'rgba(62,123,240,.12)' },
    // Body text (light :23 #13283C / dark :23 #EAF1F8).
    textMain: { light: '#13283C', dark: '#EAF1F8' },
    // Muted text (light :52 #4A6076 / dark :52 #8FA3B6).
    textMuted: { light: '#4A6076', dark: '#8FA3B6' },
    // Hairline: the nav/footer border (light :30 / dark :30).
    border: { light: 'rgba(15,50,90,.10)', dark: 'rgba(255,255,255,.06)' },
    // Strong border: the hero card border (light :64 / dark :64).
    borderStrong: { light: 'rgba(20,60,110,.20)', dark: 'rgba(120,180,240,.25)' },
  },
  // The decorative background layers — exact template values, sourced from
  // assets/graphics.json (grid :25, glow :23, band :171, panel :205 in both
  // digitacloud.app templates; card from digitaplatform.com.dc.html:97 dark /
  // light :97 — the flat white standard card).
  graphics: GRAPHICS,
};

export default signature;
