// The list of keys gen-signature accepts is the Signature type the host reads, as the newest
// published @digitaplatform/theme declares it, and a key outside it is named.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SIGNATURE_KEYS, unreadSignatureKeys } from './signature-keys.mjs';

/** The property names of `interface <name>` in a declaration file. */
function interfaceKeys(dts, name) {
  const body = dts.slice(dts.indexOf(`export interface ${name} {`));
  const lines = body.slice(0, body.indexOf('\n}')).split('\n');
  return lines.map((line) => /^ {4}(\w+)\??:/.exec(line)?.[1]).filter(Boolean);
}

// The package exports no type file, so it is read from the folder pnpm installs it in.
const typesOf = (file) => readFileSync(new URL(`./node_modules/theme-published/dist/${file}`, import.meta.url), 'utf8');

test('the accepted keys are the Signature type of the published theme', () => {
  const published = interfaceKeys(typesOf('signatures/index.d.ts'), 'Signature');
  // PLANTED INNOCENT: the type was read, so an equal list means the comparison looked.
  assert.ok(published.includes('accent') && published.includes('graphics'));
  assert.deepEqual([...SIGNATURE_KEYS].sort(), [...published].sort());
});

test('PLANTED DEFECT: a key the host does not read is named', () => {
  assert.deepEqual(unreadSignatureKeys({ id: 'x', name: 'X', accent: '#000000', logoUrl: '/logo.svg' }), ['logoUrl']);
});
