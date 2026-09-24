import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const consultaSource = readFileSync(new URL('../src/pages/consulta.astro', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../src/services/api.js', import.meta.url), 'utf8');

test('el reintento de depósito SAT consulta únicamente depósito', () => {
  assert.match(consultaSource, /runFetchSATDeposito/);
  assert.match(consultaSource, /cardId === 'sat_deposito'\) await fetchSATDeposito\(plate\)/);
  assert.match(apiSource, /\/sat\/deposito\/\$\{plate\}/);

  const isolatedRetry = apiSource.slice(
    apiSource.indexOf('export async function runFetchSATDeposito'),
    apiSource.indexOf('export async function runFetchSATDeuda'),
  );
  assert.doesNotMatch(isolatedRetry, /\/sat\/\$\{plate\}/);
});
