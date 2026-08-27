// validator/test/detect.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detect } from '../lib/detect.js';

const clean = `
<script type="module">
  import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web';
  Interact.create({ interactions: [{ key:'a', trigger:'hover',
    effects:[{ namedEffect:{ type:'FadeIn' }, duration:300, triggerType:'once' }] }] });
</script>
<interact-element data-interact-key="a"><div>x</div></interact-element>`;

test('clean current file', () => {
  const d = detect('X.html', clean);
  assert.equal(d.usesInteract, true);
  assert.equal(d.version, '2.5.1');
  assert.equal(d.isLatest, true);
  assert.equal(d.usesCustomEffect, false);
  assert.equal(d.usesExtraJs, false);
  assert.deepEqual(d.oldSyntaxMarkers, []);
  assert.equal(d.category, 'Clean & current');
});

test('a version newer than the pinned latest still counts as current', () => {
  // Regression: an exact-equality check flagged 2.5.5 as outdated, so the UI
  // painted a newer file with the yellow "old version" dot.
  const d = detect('Z.html', clean.replace('@wix/interact@2.5.1', '@wix/interact@2.5.5'));
  assert.equal(d.version, '2.5.5');
  assert.equal(d.isLatest, true);
  assert.equal(d.category, 'Clean & current');
});

test('a pattern named only in a comment is not extra JS', () => {
  // Regression: a file documenting what it deliberately avoids was flagged for
  // doing it. The comment below is the exact shape that tripped the detector.
  const d = detect('C.html', `
<script type="module">
  import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web';
  /* No scroll listeners, no requestAnimationFrame loop, no Element.animate() calls. */
  // and no IntersectionObserver or setInterval either
  Interact.create({ interactions: [] });
</script>`);
  assert.deepEqual(d.extraJsSignals, []);
  assert.equal(d.usesExtraJs, false);
  assert.equal(d.category, 'Clean & current');
});

test('real extra JS is still detected next to a comment that names it', () => {
  const d = detect('D.html', `
<script type="module">
  import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web';
  // deliberately no requestAnimationFrame loop here
  el.addEventListener('pointerdown', drag);
</script>`);
  assert.deepEqual(d.extraJsSignals, ['addEventListener(pointerdown)']);
  assert.equal(d.usesExtraJs, true);
});

test('an apostrophe in HTML prose does not swallow the rest of the file', () => {
  // The string-aware walk must stay inside <script>: treating "it's" as an
  // opening quote hid the import and read the file as not using interact.
  const d = detect('E.html', `
<p>It's a gallery. Don't scroll too fast.</p>
<script type="module">
  import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web';
  el.addEventListener('scroll', onScroll);
</script>`);
  assert.equal(d.usesInteract, true);
  assert.equal(d.version, '2.5.1');
  assert.deepEqual(d.extraJsSignals, ['addEventListener(scroll)']);
});

test('a // inside an import URL is not treated as a line comment', () => {
  const d = detect('F.html', `
<script type="module">
  import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web';
  el.addEventListener('wheel', onWheel);
</script>`);
  assert.equal(d.version, '2.5.1');
  assert.deepEqual(d.extraJsSignals, ['addEventListener(wheel)']);
});

test('outdated version', () => {
  const d = detect('Y.html', `import { Interact } from 'https://esm.sh/@wix/interact@1.79.0';`);
  assert.equal(d.usesInteract, true);
  assert.equal(d.version, '1.79.0');
  assert.equal(d.isLatest, false);
  assert.equal(d.category, 'Outdated version');
});

test('not using interact', () => {
  const d = detect('Z.html', `<script>console.log('hi')</script>`);
  assert.equal(d.usesInteract, false);
  assert.equal(d.version, null);
  assert.equal(d.category, 'Not using interact');
});

test('old syntax markers flag a latest-version file as outdated', () => {
  const src = `import {Interact} from 'https://esm.sh/@wix/interact@2.5.1/web';
    Interact.create({ interactions:[{ key:'a', trigger:'hover',
      params:{ method:'toggle' }, effects:[{ customEffect:()=>{} }] }] });
    <wix-interact-element data-interact-key="a"></wix-interact-element>`;
  const d = detect('W.html', src);
  assert.ok(d.oldSyntaxMarkers.some((m) => m.includes('wix-interact-element')));
  assert.ok(d.oldSyntaxMarkers.some((m) => m.includes('method')));
  assert.equal(d.category, 'Outdated version');
});

test('extra js detection', () => {
  const src = `import {Interact} from 'https://esm.sh/@wix/interact@2.5.1/web';
    window.addEventListener('scroll', () => {});
    new IntersectionObserver(() => {});
    el.animate([], 300);`;
  const d = detect('V.html', src);
  assert.equal(d.usesExtraJs, true);
  assert.ok(d.extraJsSignals.includes('addEventListener(scroll)'));
  assert.ok(d.extraJsSignals.includes('IntersectionObserver'));
  assert.ok(d.extraJsSignals.includes('Element.animate()'));
  assert.equal(d.category, 'Uses extra JS');
});

test('customEffect on a latest, no-extra-js file', () => {
  const src = `import {Interact} from 'https://esm.sh/@wix/interact@2.5.1/web';
    Interact.create({ interactions:[{ key:'a', trigger:'pointerMove',
      effects:[{ customEffect:(el,p)=>{} }] }] });`;
  const d = detect('U.html', src);
  assert.equal(d.usesCustomEffect, true);
  assert.equal(d.usesExtraJs, false);
  assert.equal(d.category, 'Uses customEffect');
});
