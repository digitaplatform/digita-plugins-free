#!/usr/bin/env node
// gen-assets — inlines the digita brand ASSET FILES (assets/*) into a generated
// TS module (src/assets.ts) so the compiled Signature config carries them
// verbatim (the plugin-delivery model inlines everything into
// dist/digita-plugin.json). The FILES in assets/ are the single editable source
// of truth — copied 1:1 from digita-websites/claude-design-templates (icons/,
// backgrounds/) — and this script only derives, never invents:
//   - digita-platform-appicon.svg → APPICON_SVG (verbatim) + MONOGRAM_SVG (the
//     icon adapted for inline chrome use: root width/height stripped so CSS
//     sizes it, ids namespaced `dgp-`, aria-hidden). The platform apps ARE
//     digitaplatform (the platform software): the generated admin app in
//     digitaplatform.com.dc.html:237 wears this dot+bars mark while running on
//     digitacloud.app (:251), exactly the situation of our apps.
//   - digita-cloud-appicon.svg → CLOUD_APPICON_SVG + CLOUD_MONOGRAM_SVG (ids
//     `dgc-`) — the digitacloud.app mark (the runtime/portal), for surfaces
//     that represent the hosting side (digitacloud.app.dc.html:32/:97).
//   - digita-platform-wordmark.svg → WORDMARK_SVG, digita-cloud-wordmark.svg →
//     CLOUD_WORDMARK_SVG (the "digita●platform"/"digita●cloud" lockups per the
//     navbars, digitaplatform.com.dc.html:35 / digitacloud.app.dc.html:33).
//   - backgrounds/*.svg → GRAPHICS: the REAL background vectors ("Design
//     Assets.dc.html" § Website-Flächen: the sites' background layers as
//     standalone vectors, "genau so liegt es auf den Websites"), inlined as
//     url("data:image/svg+xml,...") so applySignature's --sig-* vars paint the
//     actual files. Per-layer treatment:
//       grid/glow — verbatim (intrinsic 1920×1080 kept: the grid's baked 40px
//         pattern tiles seamlessly at natural size; the glow is one top-anchored
//         panel the backdrop sizes via CSS);
//       band/card/panel — adapted for stretch (root width/height stripped +
//         preserveAspectRatio="none"), because the sites paint these surfaces
//         at arbitrary element sizes (consumers use background-size:100% 100%).
//   - fonts.css → GOOGLE_FONTS_URL + GOOGLE_FONTS_LINKS (the exact <link> tags
//     from the template helmets, identical across all four sites).
// Run before tsc: `node ./scripts/gen-assets.mjs && tsc && gen-signature`.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(pkgDir, rel), 'utf8').trim();

// Collapse pretty-printing to one line (line breaks in these files sit between
// tags; a single space is always XML-safe there).
const oneLine = (svg) => svg.replace(/\r?\n\s*/g, ' ');

/** Adapt an app icon for inline <html> use: strip the fixed root width/height
 *  (the consumer sizes via CSS, viewBox preserved), add aria-hidden
 *  (decorative — the chrome supplies the accessible name), and namespace every
 *  id (a raster-fixed id like "glow" would collide with other inlined SVGs on
 *  the same page; first-id-wins would corrupt the gradients). */
function toMonogram(svg, ns) {
  let out = svg
    .replace(/<svg([^>]*?)\s+width="[^"]*"\s+height="[^"]*"/, '<svg$1')
    .replace(/<svg /, '<svg aria-hidden="true" ');
  for (const id of [...new Set([...out.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))]) {
    out = out.replaceAll(`id="${id}"`, `id="${ns}-${id}"`).replaceAll(`url(#${id})`, `url(#${ns}-${id})`);
  }
  return oneLine(out).replace(/> </g, '><');
}

/** A background file as a self-contained CSS image value. `stretch` strips the
 *  root width/height and sets preserveAspectRatio="none" so the vector fills
 *  whatever surface paints it (background-size:100% 100%); without it the file
 *  keeps its intrinsic size (the grid tiles at 1:1, the glow is sized by the
 *  backdrop). Ids need no namespacing — a data: URI is its own document. */
function toCssUrl(rel, { stretch = false } = {}) {
  let svg = read(rel);
  if (stretch) {
    svg = svg.replace(
      /<svg([^>]*?)\s+width="[^"]*"\s+height="[^"]*"/,
      '<svg$1 preserveAspectRatio="none"',
    );
  }
  return `url("data:image/svg+xml,${encodeURIComponent(oneLine(svg))}")`;
}

const platformIcon = read('assets/digita-platform-appicon.svg');
const cloudIcon = read('assets/digita-cloud-appicon.svg');
const platformWordmark = read('assets/digita-platform-wordmark.svg');
const cloudWordmark = read('assets/digita-cloud-wordmark.svg');

// The REAL background layers (assets/backgrounds/*, verbatim copies of the
// design-template files — the simetrix-* prefix is the asset library's naming;
// per "Design Assets.dc.html" these are the background layers of ALL the digita
// sites, e.g. the band is the „Why digita" section surface).
const GRAPHICS = {
  grid: {
    light: toCssUrl('assets/backgrounds/simetrix-grid-overlay-light.svg'),
    dark: toCssUrl('assets/backgrounds/simetrix-grid-overlay-dark.svg'),
  },
  glow: {
    light: toCssUrl('assets/backgrounds/simetrix-glow-light.svg'),
    dark: toCssUrl('assets/backgrounds/simetrix-glow-dark.svg'),
  },
  band: {
    light: toCssUrl('assets/backgrounds/simetrix-band-light.svg', { stretch: true }),
    dark: toCssUrl('assets/backgrounds/simetrix-band-dark.svg', { stretch: true }),
  },
  card: {
    light: toCssUrl('assets/backgrounds/simetrix-card-light.svg', { stretch: true }),
    dark: toCssUrl('assets/backgrounds/simetrix-card-dark.svg', { stretch: true }),
  },
  panel: {
    light: toCssUrl('assets/backgrounds/simetrix-panel-contact-light.svg', { stretch: true }),
    dark: toCssUrl('assets/backgrounds/simetrix-panel-contact-dark.svg', { stretch: true }),
  },
};

const fontsCss = read('assets/fonts.css');
const urlMatch = /@import url\('([^']+)'\)/.exec(fontsCss);
if (!urlMatch) throw new Error('[gen-assets] assets/fonts.css: no @import url(...) found.');
const fontsUrl = urlMatch[1];
// The exact tags from the template <helmet> (digitacloud.app.dc.html:11-13,
// identical in digitaplatform.com.dc.html and the light variants).
const fontsLinks = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  `<link href="${fontsUrl}" rel="stylesheet">`,
].join('\n');

const banner = `// GENERATED by scripts/gen-assets.mjs from the files in assets/ — DO NOT EDIT.
// Edit the asset files (the single source of truth) and rebuild.`;
const lit = (s) => JSON.stringify(s);

writeFileSync(
  join(pkgDir, 'src', 'assets.ts'),
  `${banner}

/** The real digita-platform app icon (assets/digita-platform-appicon.svg),
 *  verbatim — the platform apps ARE digitaplatform, hosted on digitacloud. */
export const APPICON_SVG = ${lit(platformIcon)};

/** The platform app icon adapted for inline brand-chrome use: no fixed
 *  width/height (CSS sizes it, viewBox intact), ids namespaced \`dgp-\`,
 *  aria-hidden. */
export const MONOGRAM_SVG = ${lit(toMonogram(platformIcon, 'dgp'))};

/** The real digita-cloud app icon (assets/digita-cloud-appicon.svg), verbatim —
 *  the digitacloud.app (runtime/portal) mark, for hosting-side surfaces. */
export const CLOUD_APPICON_SVG = ${lit(cloudIcon)};

/** The cloud app icon adapted for inline brand-chrome use (ids \`dgc-\`). */
export const CLOUD_MONOGRAM_SVG = ${lit(toMonogram(cloudIcon, 'dgc'))};

/** The "digita●platform" wordmark lockup (assets/digita-platform-wordmark.svg),
 *  per the digitaplatform.com navbar (digitaplatform.com.dc.html:35). */
export const WORDMARK_SVG = ${lit(oneLine(platformWordmark))};

/** The "digita●cloud" wordmark lockup (assets/digita-cloud-wordmark.svg),
 *  per the digitacloud.app navbar (digitacloud.app.dc.html:33). */
export const CLOUD_WORDMARK_SVG = ${lit(oneLine(cloudWordmark))};

/** The decorative background layers — the REAL background vectors
 *  (assets/backgrounds/*.svg, 1:1 from the design templates) inlined as
 *  self-contained CSS url("data:image/svg+xml,...") values.
 *  grid/glow keep their intrinsic 1920×1080 (the grid's 40px pattern tiles at
 *  natural size; the backdrop sizes the glow); band/card/panel stretch
 *  (preserveAspectRatio="none" — paint with background-size:100% 100%). */
export const GRAPHICS: Record<'grid' | 'glow' | 'band' | 'card' | 'panel', { light: string; dark: string }> =
  ${JSON.stringify(GRAPHICS, null, 2).replace(/\n/g, '\n  ')};

/** The exact Google-Fonts CSS URL (assets/fonts.css). */
export const GOOGLE_FONTS_URL = ${lit(fontsUrl)};

/** The exact <link> tags from the template helmet (preconnects + stylesheet)
 *  for apps that load the fonts from index.html instead of bundled CSS. */
export const GOOGLE_FONTS_LINKS = ${lit(fontsLinks)};
`,
);
console.log('[gen-assets] assets/* → src/assets.ts (real files: 2 icons, 2 wordmarks, 10 background vectors)');
