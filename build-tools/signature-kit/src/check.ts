import { contrastRatio, cssVarName, onPrimaryFor, signatureStyle, synthesizeRamp, type Signature } from '@digitaplatform/theme';
import { overlay } from './color.js';
import type { SignatureKit } from './make.js';

/** One colour pair the kit draws, measured with the WCAG 2 contrast formula. */
export interface ContrastPair {
  pair: string;
  /** `both`: the kit draws the pair from mode-static ramp steps. */
  mode: 'light' | 'dark' | 'both';
  foreground: string;
  background: string;
  ratio: number;
  minimum: number;
  status: 'pass' | 'fail';
}

const TEXT = 4.5;
const GRAPHIC = 3;

// The theme composes these grounds from surface and subtle and writes them with the signature.
const SURFACE_CONTAINERS = [
  'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest',
];

/**
 * Every text and control pair the kit draws from a signature: body and muted text on the canvas,
 * the surface, the subtle fill, the surface-container ramp the theme composes, the hovered row
 * (bgHover over the canvas and the surface), and on every graphic `paints` names; the primary label on its
 * fill (the tint rule); the badge text on its container; and the primary colour as the platform
 * draws it, in the two roles the theme writes for each mode on the signature's own canvas and surface:
 * as text (4.5:1) and as a graphic (3:1).
 */
export function checkContrast(signature: Signature, paints: SignatureKit['paints'] = {}): ContrastPair[] {
  const ramp = synthesizeRamp(signature.accent);
  if (!ramp) throw new Error(`signature ${signature.id}: accent ${signature.accent} is not a six-digit hex`);
  const colors = signature.colors;
  if (!colors) throw new Error(`signature ${signature.id} has no colour world to check`);
  const token = (name: string, mode: 'light' | 'dark') => {
    const value = colors[name]?.[mode];
    if (!value) throw new Error(`signature ${signature.id} has no ${name} colour in ${mode} mode`);
    return value;
  };
  const written = signatureStyle(signature).properties;
  const writtenColour = (name: string, mode: 'light' | 'dark') => {
    const value = /^light-dark\((#[0-9A-Fa-f]{6}), (#[0-9A-Fa-f]{6})\)$/.exec(written[cssVarName(name)] ?? '');
    if (!value) throw new Error(`signature ${signature.id}: the theme writes no hex ${cssVarName(name)} to check`);
    return value[mode === 'light' ? 1 : 2]!;
  };

  const pairs: ContrastPair[] = [];
  const measure = (pair: string, mode: ContrastPair['mode'], foreground: string, background: string, minimum: number) => {
    const ratio = Math.round(contrastRatio(foreground, background) * 100) / 100;
    const measured: ContrastPair = { pair, mode, foreground, background, ratio, minimum, status: ratio >= minimum ? 'pass' : 'fail' };
    pairs.push(measured);
    return measured;
  };

  measure('onPrimary on primary-600', 'both', onPrimaryFor(ramp), ramp['600'], TEXT);
  measure('primary-700 on primary-100', 'both', ramp['700'], ramp['100'], TEXT);
  for (const mode of ['light', 'dark'] as const) {
    for (const text of ['textMain', 'textMuted']) {
      for (const ground of ['bg', 'surface', 'subtle']) measure(`${text} on ${ground}`, mode, token(text, mode), token(ground, mode), TEXT);
      for (const ground of SURFACE_CONTAINERS) measure(`${text} on ${ground}`, mode, token(text, mode), writtenColour(ground, mode), TEXT);
      for (const ground of ['bg', 'surface']) {
        const hovered = overlay(token(ground, mode), token('bgHover', mode));
        measure(`${text} on bgHover over ${ground}`, mode, token(text, mode), hovered, TEXT);
      }
      for (const [graphic, colours] of Object.entries(paints)) {
        // A graphic has several colours under its text; the pair is as strong as its weakest one.
        const weakest = colours[mode].reduce((a, b) =>
          contrastRatio(token(text, mode), a) <= contrastRatio(token(text, mode), b) ? a : b,
        );
        measure(`${text} on ${graphic}`, mode, token(text, mode), weakest, TEXT);
      }
    }
    for (const ground of ['bg', 'surface']) {
      measure(`primaryGraphic on ${ground}`, mode, writtenColour('primaryGraphic', mode), token(ground, mode), GRAPHIC);
      measure(`primaryText on ${ground}`, mode, writtenColour('primaryText', mode), token(ground, mode), TEXT);
    }
  }
  return pairs;
}
