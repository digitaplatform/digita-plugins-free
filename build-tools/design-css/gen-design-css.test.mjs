// Every design this repository builds flips inside a dark band: each rule of its built CSS that is
// scoped by .dark carries its dark band twin. Run after `pnpm build`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { addDarkBandSelectors, DARK_BAND_SELECTOR } from '@digitaplatform/theme';

const repo = join(import.meta.dirname, '..', '..');
const designs = readdirSync(repo)
  .filter((dir) => existsSync(join(repo, dir, 'package.json')))
  .map((dir) => ({ dir, digita: JSON.parse(readFileSync(join(repo, dir, 'package.json'), 'utf8')).digita }))
  .filter(({ digita }) => digita?.type === 'design');

test('the repository has designs to look at', () => {
  assert.ok(designs.length > 0);
});

for (const { dir, digita } of designs) {
  test(`${digita.id}: every .dark rule of the built CSS carries its dark band twin`, () => {
    const css = readFileSync(join(repo, dir, 'dist', digita.entry), 'utf8');
    // The design's dark token block and its component rules, so a clean answer means they were read.
    assert.ok(css.includes(`:root[data-design="${digita.id}"].dark,\n:root[data-design="${digita.id}"] ${DARK_BAND_SELECTOR} {`));
    assert.ok((css.match(/\.dark(?![\w-])/g) ?? []).length > 10);
    // The step adds a twin wherever one is missing; on a complete build it adds nothing.
    assert.equal(addDarkBandSelectors(css), css);
  });
}
