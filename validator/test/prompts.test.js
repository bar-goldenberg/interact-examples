// validator/test/prompts.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markPrompted } from '../lib/prompts.js';

// markPrompted is pure: it takes the example list and the prompt-dir-relative
// paths, and flags which examples already have a guideline.

test('flags an html example whose mirrored .md guideline exists', () => {
  const files = [{ path: 'Image_Background/manifest-expand-scroll.html' }];
  const out = markPrompted(files, ['Image_Background/manifest-expand-scroll.md']);
  assert.equal(out[0].hasPrompt, true);
});

test('flags an md example, which maps to itself under the prompts dir', () => {
  const files = [{ path: 'interactor-examples/gallery/CardSpread.md' }];
  const out = markPrompted(files, ['interactor-examples/gallery/CardSpread.md']);
  assert.equal(out[0].hasPrompt, true);
});

test('leaves an example with no guideline unflagged', () => {
  const files = [{ path: 'Gallery-and-Carousel/CardSpread.html' }];
  const out = markPrompted(files, ['interactor-examples/gallery/CardSpread.md']);
  assert.equal(out[0].hasPrompt, false);
});

test('matches on the full mirrored path, not the basename alone', () => {
  // Same basename, different dir — the guideline does not belong to this example.
  const files = [{ path: 'UI-elements-reyan/dropdown.html' }];
  const out = markPrompted(files, ['interact-UI-elements/dropdown.md']);
  assert.equal(out[0].hasPrompt, false);
});

test('preserves the other row fields and does not mutate the input', () => {
  const files = [{ path: 'a/B.html', dir: 'a', file: 'B.html' }];
  const out = markPrompted(files, []);
  assert.deepEqual(out[0], { path: 'a/B.html', dir: 'a', file: 'B.html', hasPrompt: false });
  assert.equal('hasPrompt' in files[0], false);
});

test('accepts listPrompts() records as well as bare path strings', () => {
  const files = [{ path: 'x/Y.html' }];
  const out = markPrompted(files, [{ path: 'x/Y.md', dir: 'x', file: 'Y.md' }]);
  assert.equal(out[0].hasPrompt, true);
});

test('is case-insensitive about the .HTML extension', () => {
  const files = [{ path: 'x/Y.HTML' }];
  const out = markPrompted(files, ['x/Y.md']);
  assert.equal(out[0].hasPrompt, true);
});
