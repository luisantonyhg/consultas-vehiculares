import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ADVANCED_EXECUTION_ORDER,
  ENABLED_EXECUTION_ORDER,
} from '../src/services/execution_plan.js';

test('mantiene 18 secciones habilitadas en orden explícito', () => {
  assert.equal(ENABLED_EXECUTION_ORDER.length, 18);
  assert.deepEqual(
    ENABLED_EXECUTION_ORDER.map(item => item.position),
    Array.from({ length: 18 }, (_, index) => index + 1),
  );
});

test('Papeletas Lima, Lunas e historial se ejecutan antes que Captura/Depósito SAT', () => {
  assert.deepEqual(ADVANCED_EXECUTION_ORDER, [
    'lima', 'sbs', 'historial_dueños', 'lunas', 'sat_captura', 'sat_deposito',
  ]);
  const ids = ENABLED_EXECUTION_ORDER.map(item => item.id);
  assert.ok(ids.indexOf('lima') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('lunas') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('historial_dueños') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('sat_captura') < ids.indexOf('sat_deposito'));
  assert.deepEqual(ids.slice(-2), ['sat_captura', 'sat_deposito']);
});

test('LUNAS no bloquea el historial y las dos consultas SAT siguen absolutamente al final', () => {
  const ids = ENABLED_EXECUTION_ORDER.map(item => item.id);
  assert.ok(ids.indexOf('historial_dueños') < ids.indexOf('lunas'));
  assert.deepEqual(ids.slice(-2), ['sat_captura', 'sat_deposito']);
});
