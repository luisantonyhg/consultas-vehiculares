import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ADVANCED_EXECUTION_ORDER,
  ENABLED_EXECUTION_ORDER,
} from '../src/services/execution_plan.js';

test('mantiene 21 secciones automáticas habilitadas en orden explícito', () => {
  assert.equal(ENABLED_EXECUTION_ORDER.length, 21);
  assert.deepEqual(
    ENABLED_EXECUTION_ORDER.map(item => item.position),
    Array.from({ length: 21 }, (_, index) => index + 1),
  );
});

test('SBS se ejecuta al final y no bloquea las otras secciones avanzadas', () => {
  assert.deepEqual(ADVANCED_EXECUTION_ORDER, [
    'sigm', 'lima', 'municipal', 'soat', 'atu', 'historial_dueños', 'sat_captura', 'sat_deposito', 'sbs',
  ]);
  const ids = ENABLED_EXECUTION_ORDER.map(item => item.id);
  assert.ok(ids.indexOf('lima') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('lunas') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('sigm') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('historial_dueños') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('atu') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('sat_captura') < ids.indexOf('sat_deposito'));
  assert.equal(ids.at(-1), 'sbs');
});

test('LUNAS se ejecuta temprano y siniestralidad queda absolutamente al final', () => {
  const ids = ENABLED_EXECUTION_ORDER.map(item => item.id);
  assert.equal(ENABLED_EXECUTION_ORDER.find(item => item.id === 'lunas')?.phase, 'background');
  assert.ok(ids.indexOf('lunas') < ids.indexOf('lima'));
  assert.equal(ids.at(-1), 'sbs');
});
