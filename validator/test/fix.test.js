// validator/test/fix.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mapLimit, fixFile, runFix } from '../lib/fix.js';
import { readDraft } from '../lib/drafts.js';

const root = () => mkdtemp(join(tmpdir(), 'iv-fix-'));
const SPEC = 'spec';

test('mapLimit preserves order and caps concurrency', async () => {
  let active = 0, max = 0;
  const fn = async (n) => {
    active++; max = Math.max(max, active);
    await new Promise((r) => setTimeout(r, 5));
    active--; return n * 2;
  };
  const out = await mapLimit([1, 2, 3, 4, 5], 2, fn);
  assert.deepEqual(out, [2, 4, 6, 8, 10]);
  assert.ok(max <= 2);
});

test('fixFile writes a draft and reports fixed when recheck is clean', async () => {
  const r = await root();
  const good = `import {Interact} from 'https://esm.sh/@wix/interact@2.4.0';
    Interact.create({ interactions:[{ key:'a', trigger:'hover',
      effects:[{ namedEffect:{type:'FadeIn'}, duration:300, triggerType:'once' }] }] });`;
  const res = await fixFile(r, 'A.html', {
    source: 'OLD', optionIds: ['updateVersion'], customPrompt: '', specText: SPEC,
    runAgent: async () => good,
  });
  assert.equal(res.status, 'fixed');
  assert.equal(await readDraft(r, 'A.html'), good);
});

test('fixFile reports needsReview when draft still diagnoses as problematic', async () => {
  const r = await root();
  const res = await fixFile(r, 'B.html', {
    source: 'OLD', optionIds: ['updateVersion'], customPrompt: '', specText: SPEC,
    runAgent: async () => `import {Interact} from 'https://esm.sh/@wix/interact@1.79.0';`,
  });
  assert.equal(res.status, 'needsReview');
});

test('fixFile reports fixFailed and writes no draft when agent throws', async () => {
  const r = await root();
  const res = await fixFile(r, 'C.html', {
    source: 'OLD', optionIds: ['updateVersion'], customPrompt: '', specText: SPEC,
    runAgent: async () => { throw new Error('boom'); },
  });
  assert.equal(res.status, 'fixFailed');
  assert.match(res.error, /boom/);
  assert.equal(await readDraft(r, 'C.html'), null);
});

test('fixFile reports needsReview when convertCustomEffect requested but draft still uses customEffect', async () => {
  const r = await root();
  // Draft is latest version, no old-syntax markers, but still contains customEffect:
  const draftWithCustomEffect = `import {Interact} from 'https://esm.sh/@wix/interact@2.4.0';
    Interact.create({ interactions:[{ key:'a', trigger:'hover',
      effects:[{ customEffect: (el, p) => { el.style.opacity = p; }, duration:300, triggerType:'once' }] }] });`;
  const res = await fixFile(r, 'D.html', {
    source: 'OLD', optionIds: ['convertCustomEffect'], customPrompt: '', specText: SPEC,
    runAgent: async () => draftWithCustomEffect,
  });
  assert.equal(res.status, 'needsReview', 'should be needsReview when customEffect conversion was requested but still present');
});

test('runFix processes a batch', async () => {
  const r = await root();
  const results = await runFix(r,
    [{ path: 'A.html', source: 'x' }, { path: 'B.html', source: 'y' }],
    { optionIds: ['updateVersion'], customPrompt: '', specText: SPEC,
      runAgent: async () => 'import "https://esm.sh/@wix/interact@2.4.0";', concurrency: 2 });
  assert.equal(results.length, 2);
});
