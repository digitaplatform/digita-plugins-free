import { onPrimaryFor, synthesizeRamp, type Signature, type SignatureValue } from '@digitaplatform/theme';
import { oklchHex, rgba } from './color.js';
import { graphicsFor, markSvg, wordmarkSvg, type Graphic } from './graphics.js';
import type { SignatureInput } from './input.js';

/** A signature made from its input: the Signature object, its asset files by name, and per graphic
 *  the opaque colours text can sit on, which checkContrast reads. */
export interface SignatureKit {
  signature: Signature;
  assets: Record<string, string>;
  paints: Record<string, { light: string[]; dark: string[] }>;
}

// The neutrals as OKLCH lightness and chroma, measured on the digita design templates, whose light
// and dark worlds the owner approved; the temperature sets their hue, and `neutral` drops the chroma.
const NEUTRAL_TONES = {
  light: { bg: [0.978, 0.005], surface: [1, 0], subtle: [0.968, 0.009], textMain: [0.27, 0.046], textMuted: [0.48, 0.045] },
  dark: { bg: [0.148, 0.023], surface: [0.163, 0.026], subtle: [0.234, 0.047], textMain: [0.955, 0.012], textMuted: [0.706, 0.036] },
} as const;
const HUE = { cool: 250, warm: 70, neutral: 0 } as const;

type Tone = keyof (typeof NEUTRAL_TONES)['light'];

const cssUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const stack = (family: string, generic: string) => `'${family}', ${generic}`;

export function makeSignature(input: SignatureInput): SignatureKit {
  const ramp = synthesizeRamp(input.brand);
  if (!ramp) throw new Error(`signature input: brand ${input.brand} is not a six-digit hex`);
  const brand = ramp['600'];
  const label = onPrimaryFor(ramp);
  const chroma = input.neutral === 'neutral' ? 0 : 1;
  const tone = (mode: 'light' | 'dark', token: Tone) => {
    const [L, C] = NEUTRAL_TONES[mode][token];
    return oklchHex(L, C * chroma, HUE[input.neutral]);
  };
  const pair = (token: Tone): SignatureValue => ({ light: tone('light', token), dark: tone('dark', token) });
  const [bg, surface, subtle, textMain, textMuted] = (['bg', 'surface', 'subtle', 'textMain', 'textMuted'] as const).map(pair) as [
    SignatureValue, SignatureValue, SignatureValue, SignatureValue, SignatureValue,
  ];

  const layers = {
    light: graphicsFor(input, { bg: bg.light, surface: surface.light, subtle: subtle.light, ink: textMain.light, brand }, 'light'),
    dark: graphicsFor(input, { bg: bg.dark, surface: surface.dark, subtle: subtle.dark, ink: textMain.dark, brand }, 'dark'),
  };
  const monogram = markSvg(input, label);
  const wordmark = wordmarkSvg(input, brand, label, textMain);

  const graphics: Record<string, SignatureValue> = {};
  const paints: SignatureKit['paints'] = {};
  const assets: Record<string, string> = { 'mark.svg': monogram, 'wordmark.svg': wordmark };
  for (const key of Object.keys(layers.light)) {
    const [light, dark] = [layers.light[key], layers.dark[key]] as [Graphic, Graphic];
    assets[`${key}-light.svg`] = light.svg;
    assets[`${key}-dark.svg`] = dark.svg;
    paints[key] = { light: light.paints, dark: dark.paints };
    // `background` is a composed file for surfaces that paint one image; the theme knows only the layers.
    if (key !== 'background') graphics[key] = { light: cssUrl(light.svg), dark: cssUrl(dark.svg) };
  }

  const signature: Signature = {
    id: input.id,
    name: input.name,
    accent: input.brand,
    fonts: {
      display: stack(input.fonts.display, 'sans-serif'),
      sans: stack(input.fonts.sans, 'sans-serif'),
      mono: stack(input.fonts.mono, 'monospace'),
    },
    ...(input.family ? { family: input.id } : {}),
    monogram,
    wordmark,
    colors: {
      bg,
      surface,
      surfaceGlass: { light: rgba(surface.light, 0.72), dark: rgba(surface.dark, 0.6) },
      subtle,
      bgHover: { light: rgba(brand, 0.1), dark: rgba(brand, 0.12) },
      textMain,
      textMuted,
      border: { light: rgba(textMain.light, 0.1), dark: rgba(textMain.dark, 0.08) },
      borderStrong: { light: rgba(textMain.light, 0.2), dark: rgba(textMain.dark, 0.22) },
    },
    graphics,
  };
  return { signature, assets, paints };
}
