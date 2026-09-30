import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const api = readFileSync(new URL('../src/services/api.js', import.meta.url), 'utf8');

test('SPRL frontend has a bounded timeout aligned with the backend budget', () => {
  assert.match(api, /const timeoutMs = 130000/);
  assert.match(api, /tiempo máximo \(120s\)/);
  assert.doesNotMatch(api, /const timeoutMs = 240000/);
  assert.doesNotMatch(api, /tiempo máximo \(195s\)/);
});
