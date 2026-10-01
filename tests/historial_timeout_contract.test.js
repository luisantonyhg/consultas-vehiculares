import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const api = readFileSync(new URL('../src/services/api.js', import.meta.url), 'utf8');

test('SPRL frontend has a bounded timeout aligned with the backend budget', () => {
  assert.match(api, /const timeoutMs = 240000/);
  assert.match(api, /tiempo máximo \(240s\)/);
  assert.match(api, /30s de cola y hasta dos sesiones de 90s/);
});
