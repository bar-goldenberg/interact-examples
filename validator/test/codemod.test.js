import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyCodemods } from '../lib/codemod.js';

test('updateVersion pins an old explicit version', () => {
  const { output, applied } = applyCodemods("from 'https://esm.sh/@wix/interact@1.79.0'", ['updateVersion']);
  assert.match(output, /@wix\/interact@2\.4\.0/);
  assert.doesNotMatch(output, /@1\.79\.0/);
  assert.equal(applied.length, 1);
});

test('updateVersion pins an unpinned import', () => {
  const { output } = applyCodemods("from 'https://esm.sh/@wix/interact'", ['updateVersion']);
  assert.match(output, /@wix\/interact@2\.4\.0'/);
});

test('updateVersion preserves a /web subpath', () => {
  const { output } = applyCodemods("from 'https://esm.sh/@wix/interact/web'", ['updateVersion']);
  assert.match(output, /@wix\/interact@2\.4\.0\/web/);
});

test('updateVersion leaves an already-latest import unchanged (no-op)', () => {
  const { output, applied } = applyCodemods("from 'https://esm.sh/@wix/interact@2.4.0'", ['updateVersion']);
  assert.match(output, /@wix\/interact@2\.4\.0/);
  assert.equal(applied.length, 0);
});

test('updateVersion does not touch @wix/motion-presets', () => {
  const { output } = applyCodemods("from 'https://esm.sh/@wix/motion-presets'", ['updateVersion']);
  assert.equal(output, "from 'https://esm.sh/@wix/motion-presets'");
});

test('migrateSyntax renames the tag and fixes the typo', () => {
  const { output, applied } = applyCodemods('<wix-interact-element></wix-interact-element> useCutsomElement', ['migrateSyntax']);
  assert.doesNotMatch(output, /wix-interact-element/);
  assert.match(output, /<interact-element><\/interact-element>/);
  assert.match(output, /useCustomElement/);
  assert.equal(applied.length, 2);
});

test('migrateSyntax renames range-offset type→unit but not a namedEffect type', () => {
  const { output } = applyCodemods("offset: { value: 0, type: 'percentage' }, namedEffect: { type: 'FadeIn' }", ['migrateSyntax']);
  assert.match(output, /value: 0, unit: 'percentage'/);
  assert.match(output, /namedEffect: \{ type: 'FadeIn' \}/); // untouched
});

test('no options selected is a no-op', () => {
  const src = "from 'https://esm.sh/@wix/interact@1.79.0'";
  const { output, applied } = applyCodemods(src, []);
  assert.equal(output, src);
  assert.equal(applied.length, 0);
});
