import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { signatureStyle, type Signature } from '@digitaplatform/theme';
import { signature as digita } from '@digitaplatform/digita';
import { signature as simetrix } from '@digitaplatform/simetrix';
import { checkContrast, makeSignature, readSignatureInput } from './index.js';

const genSignature = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'signature-build', 'gen-signature.mjs');

const kitDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const inputOf = (name: string) =>
  readSignatureInput(JSON.parse(readFileSync(join(kitDir, 'test', `${name}.json`), 'utf8')));
const failuresOf = (name: string) => {
  const kit = makeSignature(inputOf(name));
  return checkContrast(kit.signature, kit.paints).filter((pair) => pair.status === 'fail');
};
const describe = (pairs: { pair: string; mode: string }[]) => pairs.map((p) => `${p.pair} (${p.mode})`).sort();

// gen-signature as the build runs it, on a scratch package whose dist/index.js exports `signature`:
// its exit status, its error text and the manifest it wrote, if any.
function runGenSignature(signature: object) {
  const dir = mkdtempSync(join(kitDir, 'tmp-'));
  try {
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module', digita: { id: 'digita', type: 'signature', tier: 'free', sdk: '^0.1.0' } }));
    mkdirSync(join(dir, 'dist'));
    writeFileSync(join(dir, 'dist', 'index.js'), `export const signature = ${JSON.stringify(signature)};\n`);
    const run = spawnSync(process.execPath, [genSignature], { cwd: dir, encoding: 'utf8' });
    const file = join(dir, 'dist', 'digita-plugin.json');
    const manifest: Record<string, unknown> | undefined = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined;
    return { status: run.status, stderr: run.stderr, manifest };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

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

test('a planted input fails no pair', () => {
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
  // 'onPrimary on primary-600' and 'primary-700 on primary-100' have no planted red: the theme's
  // onPrimaryFor and synthesizeRamp make both pass for every brand colour, so only a change of those
  // functions turns them red.
  const expectedFailures = [
    'textMuted on bg (light)', 'textMuted on surface (dark)', 'textMuted on card (light)',
    'textMuted on surfaceContainerHighest (light)', 'textMuted on bgHover over bg (light)',
  ];
  for (const expected of expectedFailures) {
    assert.ok(failures.includes(expected), `${expected} is not caught: ${failures.join(', ')}`);
  }
});

test('the primary label follows the tint rule of digita-platform#89', () => {
  const pairs = checkContrast(makeSignature(inputOf('planted-fail')).signature);
  const label = pairs.find((pair) => pair.pair === 'onPrimary on primary-600');
  assert.ok(label && label.status === 'pass' && label.foreground !== '#FFFFFF', JSON.stringify(label));
});

test('a signature.json that is not one object is refused by name', () => {
  for (const json of [null, 'digita', ['digita'], 3]) {
    assert.throws(() => readSignatureInput(json), /signature input: signature\.json must hold one object, not /);
  }
});

test('a font the theme does not bundle is refused as a platform dependency', () => {
  const input = JSON.parse(readFileSync(join(kitDir, 'test', 'planted-pass.json'), 'utf8'));
  input.fonts.display = 'Playfair Display';
  assert.throws(() => readSignatureInput(input), /Playfair Display.*not bundled by @digitaplatform\/theme/);
});

test('the menu shows the title, and the mark and wordmark write the name', () => {
  const input = JSON.parse(readFileSync(join(kitDir, 'test', 'planted-pass.json'), 'utf8'));
  const kit = makeSignature(readSignatureInput({ ...input, name: 'Veloluck', title: 'Veloluck Workbench' }));
  assert.equal(kit.signature.name, 'Veloluck Workbench');
  assert.match(kit.assets['wordmark.svg']!, />Veloluck<\/text>/);
  assert.doesNotMatch(kit.assets['wordmark.svg']!, /Workbench/);
  const { title: _title, ...withoutTitle } = input;
  assert.throws(() => readSignatureInput(withoutTitle), /signature input: title is undefined/);
});

test('only a step-600 text pair that misses AA is waived, and it names the platform issue', () => {
  const kit = makeSignature(inputOf('planted-fail'));
  const pairs = checkContrast(kit.signature, kit.paints);
  const find = (mode: string) => pairs.find((p) => p.pair === 'primary-600 text on bg' && p.mode === mode)!;
  assert.equal(find('dark').status, 'pass');
  assert.equal(find('light').status, 'waived');
  assert.match(find('light').reason ?? '', /digita-platform#240/);
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

test('the lockup family reaches the delivered manifest gen-signature writes', () => {
  const { signature } = makeSignature(inputOf('digita'));
  assert.equal(runGenSignature(signature).manifest?.family, 'digita');
});

test('the delivered manifest carries no logoUrl, which the platform no longer reads', () => {
  const { signature } = makeSignature(inputOf('digita'));
  const { manifest } = runGenSignature({ ...signature, logoUrl: 'https://example.test/logo.svg' });
  assert.ok(manifest, 'gen-signature wrote no manifest');
  assert.equal('logoUrl' in manifest, false);
  assert.equal(manifest['accent'], signature.accent);
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
