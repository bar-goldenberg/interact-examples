// validator/test/version.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAtLeastVersion } from '../lib/version.js';

test('an exact match satisfies the minimum', () => {
  assert.equal(isAtLeastVersion('2.5.1', '2.5.1'), true);
});

test('a newer patch, minor or major satisfies the minimum', () => {
  assert.equal(isAtLeastVersion('2.5.5', '2.5.1'), true);
  assert.equal(isAtLeastVersion('2.6.0', '2.5.1'), true);
  assert.equal(isAtLeastVersion('3.0.0', '2.5.1'), true);
});

test('an older patch, minor or major does not', () => {
  assert.equal(isAtLeastVersion('2.5.0', '2.5.1'), false);
  assert.equal(isAtLeastVersion('2.4.9', '2.5.1'), false);
  assert.equal(isAtLeastVersion('1.79.0', '2.5.1'), false);
});

test('compares segments numerically, not as strings', () => {
  // A lexicographic compare gets both of these backwards.
  assert.equal(isAtLeastVersion('2.10.0', '2.5.1'), true);
  assert.equal(isAtLeastVersion('10.0.0', '2.5.1'), true);
  assert.equal(isAtLeastVersion('2.5.10', '2.5.9'), true);
});

test('a missing or unparseable version never satisfies the minimum', () => {
  assert.equal(isAtLeastVersion(null, '2.5.1'), false);
  assert.equal(isAtLeastVersion(undefined, '2.5.1'), false);
  assert.equal(isAtLeastVersion('', '2.5.1'), false);
  assert.equal(isAtLeastVersion('next', '2.5.1'), false);
});
