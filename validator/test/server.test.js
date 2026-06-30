// validator/test/server.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.js';

async function repo() {
  const root = await mkdtemp(join(tmpdir(), 'iv-srv-'));
  await mkdir(join(root, 'G'), { recursive: true });
  await writeFile(join(root, 'G', 'A.html'),
    `import {Interact} from 'https://esm.sh/@wix/interact@1.79.0';`);
  return root;
}

async function start(root) {
  const app = createApp(root);
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, server };
}

test('GET /api/files lists animations', async () => {
  const { base, server } = await start(await repo());
  const res = await fetch(`${base}/api/files`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(body.files.some((f) => f.path === 'G/A.html'));
  server.close();
});

test('POST /api/scan returns per-file diagnosis and a summary', async () => {
  const { base, server } = await start(await repo());
  const res = await fetch(`${base}/api/scan`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  const body = await res.json();
  assert.equal(body.results[0].category, 'Outdated version');
  assert.equal(body.summary['Outdated version'], 1);
  server.close();
});

test('GET /api/file rejects path traversal', async () => {
  const { base, server } = await start(await repo());
  const res = await fetch(`${base}/api/file?path=${encodeURIComponent('../../etc/passwd')}`);
  assert.equal(res.status, 400);
  server.close();
});

test('apply flow: seed a draft via discard/apply endpoints', async () => {
  const root = await repo();
  const { base, server } = await start(root);
  // Write a draft directly through the lib to simulate a completed fix.
  const { writeDraft } = await import('../lib/drafts.js');
  await writeDraft(root, 'G/A.html', 'FIXED');
  const diff = await (await fetch(`${base}/api/diff?path=${encodeURIComponent('G/A.html')}`)).json();
  assert.ok(diff.parts.some((p) => p.added && p.value.includes('FIXED')));
  const apply = await fetch(`${base}/api/apply`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ paths: ['G/A.html'] }) });
  assert.equal(apply.status, 200);
  const after = await (await fetch(`${base}/api/file?path=${encodeURIComponent('G/A.html')}`)).json();
  assert.equal(after.source, 'FIXED');
  server.close();
});
