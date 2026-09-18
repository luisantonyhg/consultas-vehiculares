import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ADVANCED_DEPENDENCIES,
  ADVANCED_EXECUTION_ORDER,
  ENABLED_EXECUTION_ORDER,
  buildAdvancedNodes,
  splitPrioritySections,
} from '../src/services/execution_plan.js';

test('mantiene las 18 secciones automáticas habilitadas en orden explícito (ATU informativa)', () => {
  // SAT se consulta como una sección unificada y ATU sigue informativa: por
  // eso el plan real actual tiene 18, no las 20 entradas históricas.
  assert.equal(ENABLED_EXECUTION_ORDER.length, 18);
  assert.equal(new Set(ENABLED_EXECUTION_ORDER.map(item => item.id)).size, 18);
  assert.ok(ENABLED_EXECUTION_ORDER.every(item => Number.isInteger(item.position) && item.position > 0));
});

test('las secciones con navegador siguen el orden de prioridad de producción', () => {
  assert.deepEqual(ADVANCED_EXECUTION_ORDER, [
    'sigm', 'lima', 'soat', 'historial_dueños', 'sbs', 'sat', 'municipal',
  ]);
  const ids = ENABLED_EXECUTION_ORDER.map(item => item.id);
  assert.ok(ids.indexOf('lima') < ids.indexOf('historial_dueños'));
  assert.ok(ids.indexOf('historial_dueños') < ids.indexOf('sat'));
  assert.equal(ids.includes('atu'), false);
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

test('P0.3: historial espera Lima en vez de ocupar primero el navegador global', () => {
  const nodes = buildAdvancedNodes(ADVANCED_EXECUTION_ORDER);
  const deps = Object.fromEntries(nodes.map(node => [node.id, node.deps]));
  assert.deepEqual(deps.historial_dueños, ['lima']);
  assert.deepEqual(deps.sbs, ['soat', 'historial_dueños']);
});

test('P0.3: split conserva orden relativo y tolera ids desconocidos', () => {
  const { priority, standard } = splitPrioritySections(['a', 'b', 'c', 'd'], ['c', 'zzz', 'a']);
  assert.deepEqual(priority, ['a', 'c']);
  assert.deepEqual(standard, ['b', 'd']);
  const empty = splitPrioritySections(['a', 'b']);
  assert.deepEqual(empty.priority, []);
  assert.deepEqual(empty.standard, ['a', 'b']);
});

test('P0.4.1: nodos mantienen una cadena determinista para un solo navegador', () => {
  const standard = ['sigm', 'lima', 'soat', 'historial_dueños', 'sbs', 'sat', 'municipal'];
  const nodes = buildAdvancedNodes(standard);
  assert.deepEqual(nodes.map(node => node.id), standard);
  const deps = Object.fromEntries(nodes.map(node => [node.id, node.deps]));
  assert.deepEqual(deps.historial_dueños, ['lima']);
  assert.deepEqual(deps.sbs, ['soat', 'historial_dueños']);
  assert.deepEqual(deps.sat, ['sbs']);
  assert.deepEqual(deps.municipal, ['sat']);
  assert.deepEqual(deps.soat, []);
  assert.deepEqual(ADVANCED_DEPENDENCIES, {
    historial_dueños: ['lima'], sbs: ['soat', 'historial_dueños'], sat: ['sbs'], municipal: ['sat'],
  });
  const ids = nodes.map(node => node.id);
  assert.deepEqual([...ids].sort(), [...standard].sort());
  assert.equal(new Set(ids).size, ids.length);
});
