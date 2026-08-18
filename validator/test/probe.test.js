import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractDemoHtml, buildSignature, summarizeForPrompt, compareSignatures, peakMagnification } from '../lib/probe.js';

test('extractDemoHtml pulls the fence under "# Reference demo"', () => {
  const md = [
    '# Task', 'do a thing',
    '```html', '<p>not this one</p>', '```',
    '# Reference demo', '', '```html', '<!DOCTYPE html><html>YES</html>', '```',
  ].join('\n');
  assert.match(extractDemoHtml(md), /YES/);
  assert.doesNotMatch(extractDemoHtml(md), /not this one/);
});

test('extractDemoHtml falls back to the first html fence, and is empty when absent', () => {
  assert.match(extractDemoHtml('```html\n<b>x</b>\n```'), /<b>x<\/b>/);
  assert.equal(extractDemoHtml('# Task\n\nno demo here'), '');
});

const frame = (over = {}) => ([{
  key: 'card', rect: [0, 0, 100, 100], offsetW: 100, opacity: 1,
  transform: 'none', filter: 'none', ...over,
}]);

test('buildSignature detects movement, fading and filter changes', () => {
  const still = buildSignature([frame(), frame()]);
  assert.equal(still.elements[0].moves, false);
  assert.equal(still.elements[0].fades, false);

  const moved = buildSignature([frame(), frame({ rect: [50, 0, 100, 100] })]);
  assert.equal(moved.elements[0].moves, true);
  assert.equal(moved.elements[0].travel, 50);

  const faded = buildSignature([frame(), frame({ opacity: 0 })]);
  assert.equal(faded.elements[0].fades, true);

  const filtered = buildSignature([frame(), frame({ filter: 'blur(4px)' })]);
  assert.equal(filtered.elements[0].filters, true);
});

// A rotated element under a live parent perspective paints WIDER than its layout
// box. Equal widths mean the perspective never reached it.
test('buildSignature reports painted/layout magnification', () => {
  const sig = buildSignature([frame(), frame({ rect: [0, 0, 145, 100] })]);
  assert.equal(sig.elements[0].magnification, 1.45);
});

test('summarizeForPrompt names static elements explicitly', () => {
  const text = summarizeForPrompt(buildSignature([frame(), frame()]));
  assert.match(text, /STATIC/);
  assert.equal(summarizeForPrompt(null), '');
});

test('compareSignatures flags motion lost by sanitizing', () => {
  const original = buildSignature([frame(), frame({ rect: [50, 0, 100, 100] })]);
  const sanitized = buildSignature([frame(), frame()]);
  const r = compareSignatures(original, sanitized);
  assert.equal(r.ok, false);
  assert.match(r.notes.join(' '), /animated in original, static in sanitized/);
});

test('compareSignatures flags a perspective that went flat', () => {
  const original = buildSignature([frame(), frame({ rect: [0, 0, 145, 100] })]);
  const sanitized = buildSignature([frame(), frame({ rect: [10, 0, 100, 100] })]);
  assert.match(compareSignatures(original, sanitized).notes.join(' '), /flat in sanitized/);
});

// With few scroll stops most elements are never caught at the near side, so a
// per-element ratio below 1 is normal. Judging perspective per element would
// false-alarm on every multi-item 3D demo.
test('perspective verdict uses the peak across elements, not each one', () => {
  const two = (a, b) => buildSignature([
    [{ key: 'a', rect: [0, 0, 100, 100], offsetW: 100, opacity: 1, transform: 'none', filter: 'none' },
     { key: 'b', rect: [0, 0, 100, 100], offsetW: 100, opacity: 1, transform: 'none', filter: 'none' }],
    [{ key: 'a', rect: [10, 0, a, 100], offsetW: 100, opacity: 1, transform: 'none', filter: 'none' },
     { key: 'b', rect: [10, 0, b, 100], offsetW: 100, opacity: 1, transform: 'none', filter: 'none' }],
  ]);
  assert.equal(peakMagnification(two(145, 40)), 1.45);
  const r = compareSignatures(two(145, 40), two(145, 39));
  assert.equal(r.notes.filter((n) => /flat/.test(n)).length, 0);
});

test('summarizeForPrompt explains sub-1 ratios instead of implying breakage', () => {
  const sig = buildSignature([frame(), frame({ rect: [0, 0, 145, 100] })]);
  assert.match(summarizeForPrompt(sig), /IS reaching these elements/);
  assert.match(summarizeForPrompt(buildSignature([frame(), frame()])), /Do not claim a working 3D perspective/);
});

test('compareSignatures passes an equivalent sanitized demo', () => {
  const a = buildSignature([frame(), frame({ rect: [50, 0, 100, 100] })]);
  const b = buildSignature([frame(), frame({ rect: [80, 0, 100, 100] })]);   // different distance, same story
  assert.equal(compareSignatures(a, b).ok, true);
});

test('compareSignatures flags a key that vanished', () => {
  const a = buildSignature([frame(), frame({ rect: [50, 0, 100, 100] })]);
  const b = buildSignature([[{ key: 'other', rect: [0, 0, 1, 1], offsetW: 1, opacity: 1, transform: 'none', filter: 'none' }]]);
  assert.match(compareSignatures(a, b).notes.join(' '), /missing from sanitized demo/);
});
