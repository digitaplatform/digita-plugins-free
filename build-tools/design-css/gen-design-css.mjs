#!/usr/bin/env node
// Shared build tool for DESIGN-type plugin packages ONLY (a future premium
// COMPONENT package brings its own vite build instead — do not widen this).
// Run from a design package root (after `tsc`); it reads the package's
// `digita` manifest block and emits the two publishable artifacts, FLAT:
//   dist/<entry>            — the runtime CSS: the two scoped design blocks
//                             (:root[data-design="<id>"] light + .dark) followed
//                             by the design's component-variant CSS (src/variant.css).
//   dist/digita-plugin.json — the package.json `digita` block written out as JSON.
//
// The per-design generator helpers (designLight/designDark/radiusFor/typoFor/
// categoricalFor/shadowFor/motionFor/fontStack/hexToRgba/block) are VENDORED
// VERBATIM from @digitaplatform/theme's build/gen-css.mjs so each bundle's blocks
// are byte-identical to what the theme bakes for the same design. They call the
// theme's PUBLIC generators (varsForDesign/shadowVarsForMode/motionVars/
// borderRadius/fontFamily), imported from the published package.
//
// NOTE on the emitted header comment: it still names the ORIGINAL generator
// path (build/gen-designs.mjs) because the emitted CSS is guarded to stay
// byte-identical to that generator's output. Changing the header text is a
// deliberate, separate decision — it would break byte-equivalence once.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import {
  varsForDesign,
  varsForMode,
  shadowVarsForMode,
  motionVars,
  borderRadius,
  fontFamily,
} from '@digitaplatform/theme';

// ── VENDORED verbatim from @digitaplatform/theme build/gen-css.mjs ────────────
function shadowFor(d, mode) {
  return { ...shadowVarsForMode(mode), ...(d.shadow?.[mode] ?? {}) };
}
function motionFor(d) {
  return { ...motionVars(), ...(d.motion ?? {}) };
}
// Radius as vars (Phase 5a) so a design can re-shape (crisp vs pill) at runtime.
// Mode-agnostic → emitted in the light/:root block only (cascades into .dark).
// The preset references var(--radius-*); resolved value is identical for the
// default design, so existing apps are visually unchanged.
function radiusFor(d) {
  const r = { ...borderRadius, ...(d.radius ?? {}) };
  return {
    '--radius-input': r.input,
    '--radius-btn': r.btn,
    '--radius-card': r.card,
    '--radius-dialog': r.dialog,
  };
}
// Typography as vars (Phase 5b). A family with whitespace is quoted for CSS
// (unless already quoted). Mode-agnostic → light/:root block. The preset reads
// var(--font-*); resolves to the same stack for the default design.
function fontStack(arr) {
  return arr.map((f) => (/\s/.test(f) && !/^["']/.test(f) ? `"${f}"` : f)).join(', ');
}
function typoFor(d) {
  const t = { ...fontFamily, ...(d.typography ?? {}) };
  return {
    '--font-sans': fontStack(t.sans),
    '--font-display': fontStack(t.display),
    '--font-mono': fontStack(t.mono),
  };
}
// Categorical/identity palette — 8 hues per mode → --color-cat-1..8 plus a derived
// low-alpha --color-cat-N-soft (chip/tag backgrounds). Required in every design
// (coverage-guarded below); no platform default — identity colour is per-design.
function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
function categoricalFor(d, mode) {
  const out = {};
  d.categorical[mode].forEach((c, i) => {
    out[`--color-cat-${i + 1}`] = c;
    out[`--color-cat-${i + 1}-soft`] = hexToRgba(c, 0.14);
  });
  return out;
}
// Motion vars ride only in the light block (they cascade into .dark unchanged),
// mirroring the bare-block composition above.
function designLight(d) {
  return {
    ...varsForDesign(d, 'light'),
    ...shadowFor(d, 'light'),
    ...motionFor(d),
    ...radiusFor(d),
    ...typoFor(d),
    ...categoricalFor(d, 'light'),
  };
}
function designDark(d) {
  return { ...varsForDesign(d, 'dark'), ...shadowFor(d, 'dark'), ...categoricalFor(d, 'dark') };
}

function block(selector, vars) {
  const lines = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  return `${selector} {\n${lines}\n}`;
}
// ── end vendored helpers ──────────────────────────────────────────────────────

// varsForMode is imported to mirror the theme's public build API surface; the
// per-design bundles only need varsForDesign (via designLight/designDark).
void varsForMode;

// The design package this run builds: cwd (pnpm runs scripts with cwd = the
// package dir), overridable with an explicit path argument.
const pkgDir = resolve(process.argv[2] ?? process.cwd());
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
const digita = pkg.digita;
if (!digita || digita.type !== 'design') {
  throw new Error(`[design-css] ${pkgDir}: package.json needs a "digita" block with type:'design'.`);
}
const id = digita.id;
if (!id || digita.entry !== `${id}.css`) {
  throw new Error(`[design-css] ${pkgDir}: digita.entry must be "<id>.css" (got id=${id}, entry=${digita.entry}).`);
}

// The compiled design object from the package's local tsc output.
const design = (await import(pathToFileURL(join(pkgDir, 'dist', 'index.js')).href)).default;
if (design?.meta?.id !== id) {
  throw new Error(`[design-css] ${pkgDir}: compiled design meta.id "${design?.meta?.id}" !== digita.id "${id}".`);
}

const light = designLight(design);
const dark = designDark(design);
const variantCss = readFileSync(join(pkgDir, 'src', 'variant.css'), 'utf8').trimEnd();

const css =
  `/* GENERATED by digita-plugins-free build-tools/design-css — do not edit by hand. */\n\n` +
  block(`:root[data-design="${id}"]`, light) +
  '\n\n' +
  block(`:root[data-design="${id}"].dark`, dark) +
  '\n\n' +
  variantCss +
  '\n';

const distDir = join(pkgDir, 'dist');
mkdirSync(distDir, { recursive: true });
writeFileSync(join(distDir, digita.entry), css);
writeFileSync(join(distDir, 'digita-plugin.json'), JSON.stringify(digita, null, 2) + '\n');

console.log(
  `[design-css] ${id}(${Object.keys(light).length}L/${Object.keys(dark).length}D) → dist/${digita.entry} + dist/digita-plugin.json`,
);
