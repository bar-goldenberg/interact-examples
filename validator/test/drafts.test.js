// validator/test/drafts.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveSafe, writeDraft, readDraft, readOriginal,
  computeDiff, applyDraft, discardDraft } from '../lib/drafts.js';

async function repo() {
  const root = await mkdtemp(join(tmpdir(), 'iv-drafts-'));
  await mkdir(join(root, 'Gallery-and-Carousel'), { recursive: true });
  await writeFile(join(root, 'Gallery-and-Carousel', 'A.html'), 'ORIGINAL\n');
  return root;
}

test('resolveSafe rejects traversal', async () => {
  const root = await repo();
  assert.throws(() => resolveSafe(root, '../escape.html'), /escapes root/);
  assert.doesNotThrow(() => resolveSafe(root, 'Gallery-and-Carousel/A.html'));
});

test('write/read draft round trip', async () => {
  const root = await repo();
  await writeDraft(root, 'Gallery-and-Carousel/A.html', 'FIXED\n');
  assert.equal(await readDraft(root, 'Gallery-and-Carousel/A.html'), 'FIXED\n');
  assert.equal(await readDraft(root, 'Gallery-and-Carousel/missing.html'), null);
});

test('computeDiff marks added and removed lines', async () => {
  const parts = computeDiff('ORIGINAL\n', 'FIXED\n');
  assert.ok(parts.some((p) => p.removed && p.value.includes('ORIGINAL')));
  assert.ok(parts.some((p) => p.added && p.value.includes('FIXED')));
});

test('applyDraft overwrites original and clears draft', async () => {
  const root = await repo();
  await writeDraft(root, 'Gallery-and-Carousel/A.html', 'FIXED\n');
  await applyDraft(root, 'Gallery-and-Carousel/A.html');
  assert.equal(await readOriginal(root, 'Gallery-and-Carousel/A.html'), 'FIXED\n');
  assert.equal(await readDraft(root, 'Gallery-and-Carousel/A.html'), null);
});

test('applyDraft throws when no draft', async () => {
  const root = await repo();
  await assert.rejects(() => applyDraft(root, 'Gallery-and-Carousel/A.html'), /no draft/);
});

test('discardDraft removes draft only', async () => {
  const root = await repo();
  await writeDraft(root, 'Gallery-and-Carousel/A.html', 'FIXED\n');
  await discardDraft(root, 'Gallery-and-Carousel/A.html');
  assert.equal(await readDraft(root, 'Gallery-and-Carousel/A.html'), null);
  assert.equal(await readOriginal(root, 'Gallery-and-Carousel/A.html'), 'ORIGINAL\n');
});
