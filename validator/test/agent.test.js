// validator/test/agent.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractHtml } from '../lib/agent.js';

test('extractHtml strips html code fences', () => {
  assert.equal(extractHtml('```html\n<div>x</div>\n```'), '<div>x</div>');
});
test('extractHtml strips bare fences', () => {
  assert.equal(extractHtml('```\n<div>x</div>\n```'), '<div>x</div>');
});
test('extractHtml passes through plain html', () => {
  assert.equal(extractHtml('<!DOCTYPE html>\n<html></html>'), '<!DOCTYPE html>\n<html></html>');
});
test('extractHtml extracts fenced block when prose precedes it', () => {
  assert.equal(extractHtml('Here:\n```html\n<div>x</div>\n```'), '<div>x</div>');
});
test('extractHtml returns trimmed text unchanged when no fence present', () => {
  assert.equal(extractHtml('  no fence here  '), 'no fence here');
});
