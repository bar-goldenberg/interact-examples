import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRenderDoc } from '../public/render-frame.js';

test('buildRenderDoc embeds section html, css, config, and imports the runtime', () => {
  const doc = buildRenderDoc({ html: '<div class="card">x</div>', css: '.card{color:red}', config: '{"schema":"interact-experience/1.0"}' });
  assert.match(doc, /<div class="card">x<\/div>/);
  assert.match(doc, /\.card\{color:red\}/);
  assert.match(doc, /\/vendor\/render-runtime\.js/);
  assert.match(doc, /createExperience/);
  assert.match(doc, /interact-experience\\?\/1\.0|interact-experience/);
});

test('buildRenderDoc escapes a closing script tag in the config to avoid breakout', () => {
  const doc = buildRenderDoc({ html: '', css: '', config: '{"x":"</script>"}' });
  assert.doesNotMatch(doc, /<\/script>\s*<\/script>/);   // the payload's </script> must be escaped
  assert.match(doc, /<\\\/script>/);
});
