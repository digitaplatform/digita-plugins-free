import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const NEUTRALS = ['cool', 'neutral', 'warm'] as const;
export const MOTIFS = ['grid', 'dots', 'diagonal'] as const;
export const GRAPHIC_STYLES = ['soft', 'sharp'] as const;

/** One signature, as its `signature.json` states it. */
export interface SignatureInput {
  id: string;
  /** The company or brand name: the wordmark writes it and the mark takes its first letter. */
  name: string;
  /** The name the signature menu shows. It equals `name` for a brand with one look, and names the look
   *  where one company offers several, such as "Veloluck Workbench". A platform dependency: a signature the
   *  host registers from its package import shows it; one the platform delivers through the plugin
   *  inventory shows its id until the platform's staging tool carries the manifest's name as the record's title. */
  title: string;
  /** The signature is a lockup family: the Signature and its delivered manifest carry `family: <id>`, from
   *  which the chrome renders `<id> ● <product>`. A platform dependency: the platform's delivered-signature
   *  path (digita-platform packages/theme runtime/delivered-identity.ts) does not carry `family` yet, so a
   *  delivered family signature shows its wordmark SVG until it does. */
  family: boolean;
  /** The one brand colour, a six-digit hex; it anchors the primary ramp at step 600. */
  brand: string;
  /** The temperature of the canvas, surface and text neutrals. */
  neutral: (typeof NEUTRALS)[number];
  /** The type pairing, each a family the installed theme bundles. */
  fonts: { display: string; sans: string; mono: string };
  /** The pattern of the grid layer. */
  motif: (typeof MOTIFS)[number];
  /** soft: radial glow and smooth gradients; sharp: a hard diagonal split. */
  graphics: (typeof GRAPHIC_STYLES)[number];
}

/** The font families the installed theme bundles, read from the @font-face rules of its theme.css. */
export function bundledFonts(): string[] {
  const css = readFileSync(fileURLToPath(import.meta.resolve('@digitaplatform/theme/theme.css')), 'utf8');
  return [...new Set([...css.matchAll(/@font-face\s*\{[^}]*?font-family:\s*'([^']+)'/g)].map((m) => m[1]!))];
}

function oneOf<T extends string>(field: string, value: unknown, allowed: readonly T[]): T {
  if (!allowed.includes(value as T)) {
    throw new Error(`signature input: ${field} is ${JSON.stringify(value)}, expected one of ${allowed.join(', ')}`);
  }
  return value as T;
}

function text(field: string, value: unknown, pattern: RegExp): string {
  if (typeof value !== 'string' || !pattern.test(value)) {
    throw new Error(`signature input: ${field} is ${JSON.stringify(value)}, expected ${pattern}`);
  }
  return value;
}

/** Validate a parsed `signature.json`; every field is required and no other field is allowed. */
export function readSignatureInput(json: unknown): SignatureInput {
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new Error(`signature input: signature.json must hold one object, not ${JSON.stringify(json)}`);
  }
  const raw = json as Record<string, unknown>;
  const fields = ['id', 'name', 'title', 'family', 'brand', 'neutral', 'fonts', 'motif', 'graphics'];
  const unknown = Object.keys(raw).filter((key) => !fields.includes(key));
  if (unknown.length) throw new Error(`signature input: unknown field ${unknown.join(', ')}`);
  if (typeof raw['family'] !== 'boolean') throw new Error('signature input: family must be true or false');
  const fonts = (raw['fonts'] ?? {}) as Record<string, unknown>;
  const bundled = bundledFonts();
  const font = (role: string) => {
    const family = text(`fonts.${role}`, fonts[role], /\S/);
    if (!bundled.includes(family)) {
      throw new Error(
        `signature input: fonts.${role} "${family}" is not bundled by @digitaplatform/theme (bundled: ${bundled.join(', ')}). ` +
          'A new font is a platform dependency: the theme must bundle its font file first (digita-platform packages/theme).',
      );
    }
    return family;
  };
  return {
    id: text('id', raw['id'], /^[a-z][a-z0-9-]*$/),
    name: text('name', raw['name'], /\S/),
    title: text('title', raw['title'], /\S/),
    family: raw['family'],
    brand: text('brand', raw['brand'], /^#[0-9A-Fa-f]{6}$/),
    neutral: oneOf('neutral', raw['neutral'], NEUTRALS),
    fonts: { display: font('display'), sans: font('sans'), mono: font('mono') },
    motif: oneOf('motif', raw['motif'], MOTIFS),
    graphics: oneOf('graphics', raw['graphics'], GRAPHIC_STYLES),
  };
}
