import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyCodemods } from '../lib/codemod.js';

test('updateVersion pins an old explicit version to @latest/web', () => {
  const { output, applied } = applyCodemods("from 'https://esm.sh/@wix/interact@1.79.0'", ['updateVersion']);
  assert.match(output, /@wix\/interact@2\.5\.1\/web/);
  assert.doesNotMatch(output, /@1\.79\.0/);
  assert.equal(applied.length, 1);
});

test('updateVersion pins an unpinned import and adds /web', () => {
  const { output } = applyCodemods("from 'https://esm.sh/@wix/interact'", ['updateVersion']);
  assert.match(output, /@wix\/interact@2\.5\.1\/web'/);
});

test('updateVersion normalizes a versionless /web subpath', () => {
  const { output } = applyCodemods("from 'https://esm.sh/@wix/interact/web'", ['updateVersion']);
  assert.match(output, /@wix\/interact@2\.5\.1\/web/);
});

test('updateVersion normalizes a versioned import that lacks /web', () => {
  const { output } = applyCodemods("from 'https://esm.sh/@wix/interact@2.4.0'", ['updateVersion']);
  assert.match(output, /@wix\/interact@2\.5\.1\/web/);
  assert.doesNotMatch(output, /@2\.4\.0/);
});

test('updateVersion keeps a version newer than the pin instead of downgrading it', () => {
  // Regression: pinInteract rewrote every version to LATEST, so running the
  // fixer on a deliberately-upgraded file dragged it back down — while detect
  // was already reading >= LATEST as current. The two now agree.
  const { output, applied } = applyCodemods("from 'https://esm.sh/@wix/interact@2.5.9/web'", ['updateVersion']);
  assert.match(output, /@wix\/interact@2\.5\.9\/web/);
  assert.deepEqual(applied, []);
});

test('updateVersion adds /web to a newer version that lacks it, keeping the number', () => {
  const { output } = applyCodemods("from 'https://esm.sh/@wix/interact@2.6.0'", ['updateVersion']);
  assert.match(output, /@wix\/interact@2\.6\.0\/web/);
});

test('updateVersion leaves an already-correct import unchanged (no-op)', () => {
  const { output, applied } = applyCodemods("from 'https://esm.sh/@wix/interact@2.5.1/web'", ['updateVersion']);
  assert.match(output, /@wix\/interact@2\.5\.1\/web/);
  assert.equal(applied.length, 0);
});

test('updateVersion does not touch @wix/interact mentioned in prose/comments', () => {
  const src = "// driven by @wix/interact's pointerMove trigger";
  const { output } = applyCodemods(src, ['updateVersion']);
  assert.equal(output, src);
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

test('migrateSyntax migrates data-wix-path → data-interact-key alongside the tag', () => {
  const { output } = applyCodemods('<wix-interact-element data-wix-path=".card"><div></div></wix-interact-element>', ['migrateSyntax']);
  assert.match(output, /<interact-element data-interact-key="\.card">/);
  assert.doesNotMatch(output, /wix-interact-element/);
  assert.doesNotMatch(output, /data-wix-path/);
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
