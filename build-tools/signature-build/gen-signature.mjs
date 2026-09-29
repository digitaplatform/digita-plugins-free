#!/usr/bin/env node
// gen-signature — build tool for SIGNATURE-type plugin packages.
//
// A signature is PURE CONFIG (no runtime CSS artifact): the host applies it via
// applySignature() from the identity values inlined in the staged inventory.
// This tool reads the package's `digita` manifest block (package.json) + the
// compiled Signature object (dist/index.js `export const signature`), and emits:
//   dist/digita-plugin.json — the manifest + the full brand world, ready for the
//                             staging tool to inline into /plugins/index.json.
//
// Mirrors gen-design-css for the design-type plugins. Run as `tsc && gen-signature`.
import { writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const pkgDir = process.cwd();
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
const digita = pkg.digita;

if (!digita || digita.type !== 'signature') {
  throw new Error(`[gen-signature] ${pkgDir}: package.json needs a "digita" block with type:'signature'.`);
}

const distIndex = resolve(pkgDir, 'dist', 'index.js');
const mod = await import(pathToFileURL(distIndex).href);
const signature = mod.signature ?? mod.default;
if (!signature || typeof signature !== 'object' || signature.id !== digita.id) {
  throw new Error(
    `[gen-signature] ${pkgDir}: dist/index.js must export a Signature (\`export const signature\`) whose id matches digita.id ("${digita.id}").`,
  );
}

// The delivery manifest = the commercial/type metadata (from the digita block)
// merged with the full identity config (from the Signature object). Keeps a
// stable field order so diffs are readable.
const manifest = {
  id: digita.id,
  type: 'signature',
  tier: digita.tier,
  sdk: digita.sdk,
  displayName: digita.displayName ?? signature.name,
  name: signature.name,
  accent: signature.accent,
  ...(signature.fonts ? { fonts: signature.fonts } : {}),
  ...(signature.logoUrl ? { logoUrl: signature.logoUrl } : {}),
  ...(signature.monogram ? { monogram: signature.monogram } : {}),
  ...(signature.wordmark ? { wordmark: signature.wordmark } : {}),
  ...(signature.colors ? { colors: signature.colors } : {}),
  ...(signature.graphics ? { graphics: signature.graphics } : {}),
};

writeFileSync(join(pkgDir, 'dist', 'digita-plugin.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(
  `[gen-signature] ${digita.id}(${Object.keys(signature.colors ?? {}).length} colors, ${Object.keys(signature.graphics ?? {}).length} graphics) → dist/digita-plugin.json`,
);
