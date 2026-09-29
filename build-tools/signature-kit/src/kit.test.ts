import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { signatureStyle, type Signature } from '@digitaplatform/theme';
import { signature as digita } from '@digitaplatform/digita';
import { signature as simetrix } from '@digitaplatform/simetrix';
import { checkContrast, makeSignature, readSignatureInput } from './index.js';

const kitDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const inputOf = (name: string) =>
  readSignatureInput(JSON.parse(readFileSync(join(kitDir, 'test', `${name}.json`), 'utf8')));
const failuresOf = (name: string) => {
  const kit = makeSignature(inputOf(name));
  return checkContrast(kit.signature, kit.paints).filter((pair) => pair.status === 'fail');
};
const describe = (pairs: { pair: string; mode: string }[]) => pairs.map((p) => `${p.pair} (${p.mode})`).sort();

// The CSS variables a signature writes, as the snapshot keeps them: a long value (a data: URI of a
// background vector) is kept as its hash, so a changed vector still shows as a changed variable.
function styleSnapshot(signature: Signature): Record<string, string> {
  const style = signatureStyle(signature);
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries({ ...style.attributes, ...style.properties })) {
    out[name] = value.length > 120 ? `sha256:${createHash('sha256').update(value).digest('hex')}` : value;
  }
  return out;
}

test('a planted input whose every pair reaches AA passes', () => {
  assert.deepEqual(failuresOf('planted-pass'), []);
});

test('a planted input with a failing pair turns the check red', () => {
  // #F2C230 is a light yellow: the kit draws it as the active tab rule, the menu tick and the focus
  // ring on the light canvas, where it reaches only about 1.6:1 of the 3:1 a graphic needs.
  assert.deepEqual(describe(failuresOf('planted-fail')), [
    'primary-600 graphic on bg (light)',
    'primary-600 graphic on surface (light)',
  ]);
});

test('the check sees every pair shape it must catch', () => {
  const kit = makeSignature(inputOf('planted-pass'));
  const planted: Signature = {
    ...kit.signature,
    colors: { ...kit.signature.colors, textMuted: { light: '#B0B0B0', dark: '#3A3A3A' } },
  };
  const failures = describe(checkContrast(planted, kit.paints).filter((pair) => pair.status === 'fail'));
  for (const expected of ['textMuted on bg (light)', 'textMuted on surface (dark)', 'textMuted on card (light)']) {
    assert.ok(failures.includes(expected), `${expected} is not caught: ${failures.join(', ')}`);
  }
});

test('the primary label follows the tint rule of digita-platform#89', () => {
  const pairs = checkContrast(makeSignature(inputOf('planted-fail')).signature);
  const label = pairs.find((pair) => pair.pair === 'onPrimary on primary-600');
  assert.ok(label && label.status === 'pass' && label.foreground !== '#FFFFFF', JSON.stringify(label));
});

test('a font the theme does not bundle is refused as a platform dependency', () => {
  const input = JSON.parse(readFileSync(join(kitDir, 'test', 'planted-pass.json'), 'utf8'));
  input.fonts.display = 'Playfair Display';
  assert.throws(() => readSignatureInput(input), /Playfair Display.*not bundled by @digitaplatform\/theme/);
});

test('the kit output is a Signature the installed theme applies', () => {
  const { signature } = makeSignature(inputOf('planted-pass'));
  const style = signatureStyle(signature);
  assert.equal(style.attributes['data-signature'], 'planted-pass');
  for (const name of ['--color-bg', '--color-surface-container', '--sig-grid-l', '--sig-panel-d', '--font-display']) {
    assert.ok(style.properties[name], `${name} is not written`);
  }
});

test('make-signature writes a package that compiles against the installed theme', () => {
  const dir = mkdtempSync(join(kitDir, 'tmp-'));
  try {
    writeFileSync(join(dir, 'signature.json'), readFileSync(join(kitDir, 'test', 'planted-pass.json')));
    execFileSync(process.execPath, [join(kitDir, 'dist', 'cli.js'), dir]);
    assert.deepEqual(readdirSync(join(dir, 'assets')).sort(), [
      'background-dark.svg', 'background-light.svg', 'band-dark.svg', 'band-light.svg', 'card-dark.svg',
      'card-light.svg', 'glow-dark.svg', 'glow-light.svg', 'grid-dark.svg', 'grid-light.svg', 'mark.svg',
      'panel-dark.svg', 'panel-light.svg', 'wordmark.svg',
    ]);
    const tsc = spawnSync(
      process.execPath,
      [join(kitDir, 'node_modules', 'typescript', 'bin', 'tsc'), '--ignoreConfig', '--noEmit', '--strict', '--module', 'nodenext',
        '--moduleResolution', 'nodenext', '--skipLibCheck', join(dir, 'src', 'index.ts')],
      { encoding: 'utf8' },
    );
    assert.equal(tsc.status, 0, tsc.stdout + tsc.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('make-signature refuses an input with a failing pair and writes nothing', () => {
  const dir = mkdtempSync(join(kitDir, 'tmp-'));
  try {
    writeFileSync(join(dir, 'signature.json'), readFileSync(join(kitDir, 'test', 'planted-fail.json')));
    const run = spawnSync(process.execPath, [join(kitDir, 'dist', 'cli.js'), dir], { encoding: 'utf8' });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /primary-600 graphic on bg \(light\)/);
    assert.deepEqual(readdirSync(dir), ['signature.json']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

for (const [name, handMade] of [['digita', digita], ['simetrix', simetrix]] as const) {
  test(`${name} renders the same CSS variables as before`, () => {
    const before = JSON.parse(readFileSync(join(kitDir, 'test', `${name}.style.json`), 'utf8'));
    assert.deepEqual(styleSnapshot(handMade), before);
  });

  test(`the kit reproduces ${name}'s accent and fonts, not its colour world and vectors`, () => {
    // The hand-made package stays: its colours are picked from the design templates and its
    // graphics are the real background vectors, which no derivation from one brand colour gives.
    const made = styleSnapshot(makeSignature(inputOf(name)).signature);
    const handMadeStyle = styleSnapshot(handMade);
    const differing = Object.keys(handMadeStyle).filter((key) => made[key] !== handMadeStyle[key]).sort();
    assert.deepEqual(differing, [
      '--color-bg', '--color-bg-hover', '--color-border', '--color-border-strong', '--color-subtle',
      '--color-surface', '--color-surface-container', '--color-surface-container-high',
      '--color-surface-container-highest', '--color-surface-container-low', '--color-surface-container-lowest',
      '--color-surface-glass', '--color-text-main', '--color-text-muted',
      '--sig-band-d', '--sig-band-l', '--sig-card-d', '--sig-card-l', '--sig-glow-d', '--sig-glow-l',
      '--sig-grid-d', '--sig-grid-l', '--sig-panel-d', '--sig-panel-l',
    ]);
    assert.deepEqual(Object.keys(made).sort(), Object.keys(handMadeStyle).sort());
  });

  test(`${name}'s hand-made colours fail only the pairs named for the owner`, () => {
    // The accent #00B2F6 reaches 2.3:1 on the light canvas, under the 3:1 a graphic needs.
    assert.deepEqual(describe(checkContrast(handMade).filter((pair) => pair.status === 'fail')), [
      'primary-600 graphic on bg (light)',
      'primary-600 graphic on surface (light)',
    ]);
  });
}
