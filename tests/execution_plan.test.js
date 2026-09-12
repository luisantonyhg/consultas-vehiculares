import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ADVANCED_DEPENDENCIES,
  ADVANCED_EXECUTION_ORDER,
  ENABLED_EXECUTION_ORDER,
  buildAdvancedNodes,
  splitPrioritySections,
} from '../src/services/execution_plan.js';

test('mantiene 20 secciones automáticas habilitadas en orden explícito (ATU informativa)', () => {
  assert.equal(ENABLED_EXECUTION_ORDER.length, 20);
  assert.deepEqual(
    ENABLED_EXECUTION_ORDER.map(item => item.position),
    Array.from({ length: 20 }, (_, index) => index + 1),
  );
});

test('SBS se ejecuta al final y no bloquea las otras secciones avanzadas', () => {
  assert.deepEqual(ADVANCED_EXECUTION_ORDER, [
    'sigm', 'lima', 'municipal', 'soat', 'historial_dueños', 'sat_captura', 'sat_deposito', 'sbs',
  ]);
  const ids = ENABLED_EXECUTION_ORDER.map(item => item.id);
  assert.ok(ids.indexOf('lima') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('lunas') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('sigm') < ids.indexOf('sat_captura'));
  assert.ok(ids.indexOf('historial_dueños') < ids.indexOf('sat_captura'));
  assert.equal(ids.includes('atu'), false);
  assert.ok(ids.indexOf('sat_captura') < ids.indexOf('sat_deposito'));
  assert.equal(ids.at(-1), 'sbs');
});

test('LUNAS se ejecuta temprano y siniestralidad queda absolutamente al final', () => {
  const ids = ENABLED_EXECUTION_ORDER.map(item => item.id);
  assert.equal(ENABLED_EXECUTION_ORDER.find(item => item.id === 'lunas')?.phase, 'background');
  assert.ok(ids.indexOf('lunas') < ids.indexOf('lima'));
  assert.equal(ids.at(-1), 'sbs');
});

test('Callao queda en segundo plano y su portal lento no bloquea la fase avanzada', () => {
  const callao = ENABLED_EXECUTION_ORDER.find(item => item.id === 'callao');
  assert.equal(callao?.phase, 'background');
  assert.ok(callao.position < ENABLED_EXECUTION_ORDER.find(item => item.id === 'sigm').position);
});

test('P0.3: historial sale a carril prioritario sin alterar el resto del orden', () => {
  const { priority, standard } = splitPrioritySections(ADVANCED_EXECUTION_ORDER, ['historial_dueños']);
  assert.deepEqual(priority, ['historial_dueños']);
  assert.deepEqual(standard, ['sigm', 'lima', 'municipal', 'soat', 'sat_captura', 'sat_deposito', 'sbs']);
  // Cada id exactamente una vez entre ambas listas.
  assert.deepEqual(
    [...priority, ...standard].sort(),
    [...ADVANCED_EXECUTION_ORDER].sort(),
  );
});

test('P0.3: split conserva orden relativo y tolera ids desconocidos', () => {
  const { priority, standard } = splitPrioritySections(['a', 'b', 'c', 'd'], ['c', 'zzz', 'a']);
  assert.deepEqual(priority, ['a', 'c']);
  assert.deepEqual(standard, ['b', 'd']);
  const empty = splitPrioritySections(['a', 'b']);
  assert.deepEqual(empty.priority, []);
  assert.deepEqual(empty.standard, ['a', 'b']);
});

test('P0.4.1: nodos con dependencias SOAT→SBS y Captura→Depósito, resto intacto', () => {
  const standard = ['sigm', 'lima', 'municipal', 'soat', 'sat_captura', 'sat_deposito', 'sbs'];
  const nodes = buildAdvancedNodes(standard);
  assert.deepEqual(nodes.map(node => node.id), [
    'soat', 'sat_captura', 'sigm', 'lima', 'municipal', 'sbs', 'sat_deposito',
  ]);
  const deps = Object.fromEntries(nodes.map(node => [node.id, node.deps]));
  assert.deepEqual(deps.sbs, ['soat']);
  assert.deepEqual(deps.sat_deposito, ['sat_captura']);
  assert.deepEqual(deps.soat, []);
  assert.deepEqual(ADVANCED_DEPENDENCIES, { sbs: ['soat'], sat_deposito: ['sat_captura'] });
  const ids = nodes.map(node => node.id);
  assert.deepEqual([...ids].sort(), [...standard].sort());
  assert.equal(new Set(ids).size, ids.length);
});
