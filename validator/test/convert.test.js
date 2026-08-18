import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildConvertPrompt, convertFile, runConvert, splitProposedGlobals } from '../lib/convert.js';
import { promptRelPath, readPrompt, listPrompts } from '../lib/prompts.js';

const root = () => mkdtemp(join(tmpdir(), 'iv-conv-'));

test('promptRelPath maps .html source to .md under the prompts dir', () => {
  assert.equal(promptRelPath('Gallery-and-Carousel/CardSpread.html'), 'Gallery-and-Carousel/CardSpread.md');
  assert.equal(promptRelPath('label.htm'), 'label.md');
});

test('buildConvertPrompt embeds the skill, exemplar, globals, and source', () => {
  const { system, user } = buildConvertPrompt({
    skill: 'SKILL-BODY', exemplar: 'EXEMPLAR-BODY',
    houseRules: 'RULES-BODY', design: 'DESIGN-BODY', ladder: 'LADDER-BODY', suggested: 'SUGGESTED-BODY',
    relPath: 'a/b.html', source: '<html>SRC</html>' });
  assert.match(system, /SKILL-BODY/);
  assert.match(system, /EXEMPLAR-BODY/);
  assert.match(system, /RULES-BODY/);
  assert.match(system, /DESIGN-BODY/);
  assert.match(system, /LADDER-BODY/);
  assert.match(system, /SUGGESTED-BODY/);
  assert.match(system, /ONLY the finished example/i);
  assert.match(user, /a\/b\.html/);
  assert.match(user, /SRC/);
});

// Omitted globals must not leak the string "undefined" into the prompt — the
// agent would read it as content.
test('buildConvertPrompt tolerates missing globals', () => {
  const { system } = buildConvertPrompt({ skill: 'S', relPath: 'a.html', source: 'x' });
  assert.doesNotMatch(system, /undefined/);
});

test('splitProposedGlobals separates the trailing inbox section', () => {
  const both = splitProposedGlobals('# Task\n\nbody\n\n## Proposed globals\n\n### a fact\n- **Target:** house-rules');
  assert.equal(both.example, '# Task\n\nbody');
  assert.match(both.proposed, /### a fact/);

  const none = splitProposedGlobals('# Task\n\nbody');
  assert.equal(none.example, '# Task\n\nbody');
  assert.equal(none.proposed, '');
});

test('convertFile routes proposed globals to the inbox, not the example', async () => {
  const r = await root();
  const appended = [];
  const res = await convertFile(r, 'x.html', {
    source: 'x', skill: 'S',
    runAgent: async () => '# Task\n\nbody\n\n## Proposed globals\n\n### fact\n- **Target:** house-rules',
    appendProposed: async (p, text) => appended.push([p, text]),
  });
  assert.equal(res.proposed, true);
  assert.equal(await readPrompt(r, 'x.md'), '# Task\n\nbody');
  assert.equal(appended.length, 1);
  assert.match(appended[0][1], /### fact/);
});

test('convertFile writes the guideline to the mirrored prompt path', async () => {
  const r = await root();
  const res = await convertFile(r, 'Gallery-and-Carousel/CardSpread.html', {
    source: '<html></html>', skill: 'S', exemplar: 'E',
    runAgent: async () => '# Card Spread\n\nA guideline.',
  });
  assert.equal(res.status, 'converted');
  assert.equal(res.via, 'agent');
  assert.equal(res.outPath, 'Gallery-and-Carousel/CardSpread.md');
  assert.equal(await readPrompt(r, 'Gallery-and-Carousel/CardSpread.md'), '# Card Spread\n\nA guideline.');
});

test('convertFile strips a whole-document markdown fence', async () => {
  const r = await root();
  await convertFile(r, 'x.html', { source: 'x', skill: 'S', exemplar: 'E',
    runAgent: async () => '```markdown\n# Title\ntext\n```' });
  assert.equal(await readPrompt(r, 'x.md'), '# Title\ntext');
});

test('convertFile reports failed and writes nothing when the agent throws', async () => {
  const r = await root();
  const res = await convertFile(r, 'y.html', { source: 'x', skill: 'S', exemplar: 'E',
    runAgent: async () => { throw new Error('boom'); } });
  assert.equal(res.status, 'failed');
  assert.match(res.error, /boom/);
  assert.equal(await readPrompt(r, 'y.md'), null);
});

test('runConvert processes a batch and listPrompts finds the results', async () => {
  const r = await root();
  await runConvert(r, [{ path: 'a/one.html', source: 's' }, { path: 'two.html', source: 's' }],
    { skill: 'S', exemplar: 'E', runAgent: async () => '# G', concurrency: 2 });
  const prompts = await listPrompts(r);
  assert.deepEqual(prompts.map((p) => p.path).sort(), ['a/one.md', 'two.md']);
  assert.equal(prompts.find((p) => p.path === 'a/one.md').dir, 'a');
});

test('readPrompt refuses path traversal out of the prompts dir', async () => {
  const r = await root();
  await assert.rejects(() => readPrompt(r, '../../etc/passwd'), /escapes prompts dir/);
});
