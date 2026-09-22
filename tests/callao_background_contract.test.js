import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/pages/consulta.astro', import.meta.url), 'utf8');
const providerSource = readFileSync(new URL('../src/services/providers/official_portals.js', import.meta.url), 'utf8');

test('Callao tiene un solo ciclo automático y el manual fuerza fuente oficial', () => {
  assert.match(source, /fetchCallao\(plate, \{ forceRefresh: true \}\)/);
  assert.match(source, /runFetchWithRetry\([\s\S]*?'callao',[\s\S]*?1,[\s\S]*?1,/);
  assert.match(providerSource, /forceRefresh \? '\?force_refresh=true' : ''/);
});

test('Callao se inicia después de SAT y no participa en el lote variable previo', () => {
  const variableStart = source.indexOf('const variableSectionsPromise');
  const variableEnd = source.indexOf('// ATU queda aislada', variableStart);
  assert.ok(variableStart >= 0 && variableEnd > variableStart);
  assert.doesNotMatch(source.slice(variableStart, variableEnd), /fetchCallao/);
  assert.match(source, /provider=callao priority=85 reason=background_after_sat state=started/);
  assert.ok(source.indexOf('callaoBackgroundPromise') > source.indexOf("[UI-MAIN-READY]"));
});
