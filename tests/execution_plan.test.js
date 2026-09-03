import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ADVANCED_EXECUTION_ORDER,
  ENABLED_EXECUTION_ORDER,
} from '../src/services/execution_plan.js';

test('mantiene 20 secciones automáticas habilitadas en orden explícito', () => {
  assert.equal(ENABLED_EXECUTION_ORDER.length, 20);
  assert.deepEqual(
    ENABLED_EXECUTION_ORDER.map(item => item.position),
    Array.from({ length: 20 }, (_, index) => index + 1),
  );
});

test('Papeletas Lima, Lunas, SIGM e historial se ejecutan antes que Captura/Depósito SAT', () => {
  assert.deepEqual(ADVANCED_EXECUTION_ORDER, [
    'lima', 'sbs', 'sigm', 'historial_dueños', 'sat_captura', 'sat_deposito',
  ]);
  const ids = ENABLED_EXECUTION_ORDER.map(item => item.id);
  assert.ok(ids.indexOf('lima') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('lunas') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('sigm') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('historial_dueños') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('sat_captura') < ids.indexOf('sat_deposito'));
  assert.deepEqual(ids.slice(-2), ['sat_captura', 'sat_deposito']);
});

test('LUNAS se ejecuta en fase rápida y las dos consultas SAT siguen absolutamente al final', () => {
  const ids = ENABLED_EXECUTION_ORDER.map(item => item.id);
  assert.equal(ENABLED_EXECUTION_ORDER.find(item => item.id === 'lunas')?.phase, 'fast');
  assert.ok(ids.indexOf('lunas') < ids.indexOf('lima'));
  assert.deepEqual(ids.slice(-2), ['sat_captura', 'sat_deposito']);
});
