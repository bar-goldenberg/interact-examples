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

test('buildRenderDoc escapes </script> variants (whitespace, tab, slash, case) in the config', () => {
  for (const variant of ['</script >', '</script\t>', '</script/>', '</SCRIPT>']) {
    const doc = buildRenderDoc({ html: '', css: '', config: `{"x":"${variant}"}` });
    // The raw, unescaped payload variant must not survive anywhere in the built doc
    // (it would otherwise be recognized by the HTML tokenizer as a real closing tag).
    assert.ok(!doc.includes(variant), `expected raw "${variant}" to be escaped, but found it unescaped in the doc`);
    // The escaped form (backslash before the "/") must be present in its place.
    assert.match(doc, new RegExp('<\\\\/script' + variant.slice('</script'.length).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
