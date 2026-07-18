import type { Signature } from '@digitaplatform/theme';

// The digita "cloud" monogram — the rounded cloud glyph from digitacloud.app's
// nav tile; single-tint, inherits the accent via currentColor.
const MONOGRAM =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 19a4.5 4.5 0 0 1-.62-8.96 6 6 0 0 1 11.55-1.1A4.75 4.75 0 0 1 17.25 19H7Z"/></svg>';

// The digita wordmark lockup — "digita" + a cyan accent dot. viewBox tightened to
// the actual content width (dot ends ~x82) so it doesn't render undersized when
// width-constrained. NOTE: the letters are a live <text> element, so a machine
// without Space Grotesk shifts the width and the dot at cx=78 can gap/collide —
// outline the glyphs to paths in a later pass. Dot uses #2E9BE8 (legible on the
// white rail by day; a per-mode --sig-dot is a future refinement).
const WORDMARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 28" fill="none" aria-hidden="true"><text x="0" y="21" font-family="\'Space Grotesk\',sans-serif" font-weight="600" font-size="22" letter-spacing="-.6" fill="currentColor">digita</text><circle cx="78" cy="20" r="3.4" fill="#2E9BE8"><animate attributeName="opacity" values="1;.6;1" dur="2.4s" repeatCount="indefinite"/></circle></svg>';

/**
 * digita — the platform's own FREE signature (the default identity), reproduced
 * from digitacloud.app: cool navy canvas, cyan hero accent, 40px grid + top
 * radial glow, cloud mark + wordmark. FULL brand world (colours + graphics), so
 * an app rendered with it belongs to the digitacloud.app / digitaplatform.com
 * world. Values incorporate the accessibility + light-mode fixes from review.
 */
export const signature: Signature = {
  id: 'digita',
  name: 'Digita',
  // #2077C8 anchors the primary ramp: white-on-accent hits WCAG AA (~4.6:1),
  // where the old #3896E6 failed (3.15:1). The hero cyan (#8FDBFF) lives in the
  // glow/graphics layer, not the control accent.
  accent: '#2077C8',
  fonts: {
    display: "'Space Grotesk', 'Inter', system-ui, sans-serif",
    sans: "'Manrope', 'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
  },
  monogram: MONOGRAM,
  wordmark: WORDMARK,
  colors: {
    bg: { light: '#F5F8FB', dark: '#050B14' },
    surface: { light: '#FFFFFF', dark: '#0B1524' },
    surfaceGlass: { light: 'rgba(255,255,255,.72)', dark: 'rgba(11,21,36,.60)' },
    subtle: { light: '#F0F5FA', dark: '#0A1420' },
    bgHover: { light: 'rgba(20,60,110,.06)', dark: 'rgba(120,180,240,.06)' },
    textMain: { light: '#0D1B2A', dark: '#EAF1F8' },
    textMuted: { light: '#4A6076', dark: '#8FA3B6' },
    border: { light: 'rgba(15,50,90,.10)', dark: 'rgba(255,255,255,.08)' },
    borderStrong: { light: 'rgba(15,50,90,.18)', dark: 'rgba(120,180,240,.20)' },
  },
  graphics: {
    // 40px line grid. Bumped to .075 (light) / .07 (dark) so the 1px lines stay
    // present on standard-DPI displays (.055/.05 vanished there).
    grid: {
      light:
        'linear-gradient(rgba(20,70,130,.075) 1px, transparent 1px), linear-gradient(90deg, rgba(20,70,130,.075) 1px, transparent 1px)',
      dark: 'linear-gradient(rgba(120,180,240,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(120,180,240,.07) 1px, transparent 1px)',
    },
    // Top-left radial glow. Light gains a cyan (#8FDBFF) mid-stop so the hero
    // colour is present by day; dark bumped to .24 for the "lit from above" moment.
    glow: {
      light:
        'radial-gradient(90% 120% at 20% -5%, rgba(56,150,230,.16) 0%, rgba(143,219,255,.09) 35%, transparent 60%)',
      dark: 'radial-gradient(90% 120% at 20% -5%, rgba(56,150,230,.24) 0%, transparent 55%)',
    },
    // Full-bleed section band. Light deepened to #EAF1F8 so the step registers
    // against the #F5F8FB canvas.
    band: { light: '#EAF1F8', dark: '#03070d' },
    // Raised card / KPI tile gradient. Light end-stop deepened (#E7F0F9) so light
    // cards read as lit, not flat.
    card: {
      light: 'linear-gradient(155deg, #FFFFFF 25%, #E7F0F9)',
      dark: 'linear-gradient(155deg, rgba(22,58,95,.55), rgba(11,31,51,.35))',
    },
    // CTA / login panel: radial glow over a gradient. Light strengthened so the
    // login page reads as branded, not a plain white sheet.
    panel: {
      light:
        'radial-gradient(80% 140% at 50% 0%, rgba(56,150,230,.20), transparent 60%), linear-gradient(160deg,#FFFFFF,#DEEAF6)',
      dark: 'radial-gradient(80% 140% at 50% 0%, rgba(56,150,230,.28), transparent 60%), linear-gradient(160deg,#0d2743,#060d16)',
    },
  },
};

export default signature;
