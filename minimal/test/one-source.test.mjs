// The platform's theme.css paints minimal's tokens at :root from the theme's
// own copy and drops the token blocks of this package's CSS, so a copy here
// could only drift unseen. Run after `pnpm build`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DESIGNS } from '@digitaplatform/theme';
import minimal from '../dist/index.js';
import { tokenDisagreements } from './token-disagreements.mjs';

test('the check names a token that two copies disagree on', () => {
  const copy = structuredClone(DESIGNS.minimal);
  copy.semantic.light.textMuted = '#6B6B74';
  assert.deepEqual(tokenDisagreements(copy, DESIGNS.minimal), ['semantic.light.textMuted']);
});

test('the check passes a copy that agrees on every token', () => {
  assert.deepEqual(tokenDisagreements(structuredClone(DESIGNS.minimal), DESIGNS.minimal), []);
});

test("minimal's tokens agree with the theme's minimal", () => {
  assert.deepEqual(tokenDisagreements(minimal, DESIGNS.minimal), []);
});

test('minimal declares no token values of its own', () => {
  assert.equal(minimal, DESIGNS.minimal);
});
