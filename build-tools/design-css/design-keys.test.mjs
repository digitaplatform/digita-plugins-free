// The list of keys gen-design-css accepts is the Design type the host reads, as the newest published
// @digitaplatform/theme declares it, and a key outside it is named.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DESIGN_KEYS, unreadDesignKeys } from './design-keys.mjs';

/** The property names of `interface <name>` in a declaration file. */
function interfaceKeys(dts, name) {
  const body = dts.slice(dts.indexOf(`export interface ${name} {`));
  const lines = body.slice(0, body.indexOf('\n}')).split('\n');
  return lines.map((line) => /^ {4}(\w+)\??:/.exec(line)?.[1]).filter(Boolean);
}

// The package exports no type file, so it is read from the folder pnpm installs it in.
const typesOf = (file) => readFileSync(new URL(`./node_modules/theme-published/dist/${file}`, import.meta.url), 'utf8');

test('the accepted keys are the Design type of the published theme', () => {
  const published = interfaceKeys(typesOf('designs/types.d.ts'), 'Design');
  // PLANTED INNOCENT: the type was read, so an equal list means the comparison looked.
  assert.ok(published.includes('meta') && published.includes('categorical'));
  assert.deepEqual([...DESIGN_KEYS].sort(), [...published].sort());
});

test('PLANTED DEFECT: a key the host does not read is named', () => {
  assert.deepEqual(unreadDesignKeys({ meta: {}, semantic: {}, categorical: {}, density: {} }), ['density']);
});

// gen-design-css as the build runs it, on a scratch copy of the minimal design whose compiled design
// carries `extra` besides its own keys: its exit status, its error text and whether it wrote the CSS.
function runGenDesignCss(extra) {
  const here = dirname(fileURLToPath(import.meta.url));
  const source = join(here, '..', '..', 'minimal');
  // Outside the repository, so a run killed before `finally` leaves nothing a commit could take.
  const dir = mkdtempSync(join(tmpdir(), 'digita-plugins-free-'));
  try {
    writeFileSync(join(dir, 'package.json'), readFileSync(join(source, 'package.json')));
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src', 'variant.css'), readFileSync(join(source, 'src', 'variant.css')));
    mkdirSync(join(dir, 'dist'));
    const original = pathToFileURL(join(source, 'dist', 'index.js')).href;
    writeFileSync(join(dir, 'dist', 'index.js'), `import d from ${JSON.stringify(original)};\nexport default { ...d, ...${JSON.stringify(extra)} };\n`);
    const run = spawnSync(process.execPath, [join(here, 'gen-design-css.mjs'), dir], { encoding: 'utf8' });
    return { status: run.status, stderr: run.stderr, wroteCss: existsSync(join(dir, 'dist', 'minimal.css')), dir };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('PLANTED DEFECT: gen-design-css refuses a design with a key the host does not read, and writes nothing', () => {
  const run = runGenDesignCss({ density: { compact: {} } });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /the design holds "density"; the host reads only meta, semantic/);
  assert.equal(run.wroteCss, false);
});

test('PLANTED INNOCENT: gen-design-css writes the CSS of a design that holds only keys the host reads', () => {
  const run = runGenDesignCss({});
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.wroteCss, true);
});

test('builds its scratch design outside the repository, so a killed run leaves nothing a commit takes', () => {
  const repository = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const { dir, status } = runGenDesignCss({});
  // PLANTED INNOCENT: the generator ran on the scratch design, so its place was looked at.
  assert.equal(status, 0);
  assert.ok(!dir.startsWith(repository), `${dir} lies inside ${repository}`);
});
