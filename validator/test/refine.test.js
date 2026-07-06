import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRefinePrompt, refineGuideline } from '../lib/refine.js';

test('buildRefinePrompt forbids overfitting and embeds score+notes+guideline', () => {
  const { system, user } = buildRefinePrompt({ guideline: '# G', score: 6, notes: 'more spread' });
  assert.match(system, /general/i);
  assert.match(system, /do not overfit|not overfit/i);
  assert.match(system, /ONLY the (full )?updated guideline/i);
  assert.match(user, /6\/10/);
  assert.match(user, /more spread/);
  assert.match(user, /# G/);
});

test('refineGuideline returns fence-stripped markdown from the agent', async () => {
  const out = await refineGuideline({ guideline: '# G', score: 5, notes: 'n',
    runAgent: async () => '```markdown\n# G v2\nbody\n```' });
  assert.equal(out, '# G v2\nbody');
});

test('refineGuideline passes an onDelta through to runAgent', async () => {
  let sawOpts = null;
  await refineGuideline({ guideline: '# G', score: 5, notes: 'n', onDelta: () => {},
    runAgent: async (s, u, opts) => { sawOpts = opts; return '# ok'; } });
  assert.equal(typeof sawOpts.onDelta, 'function');
});
