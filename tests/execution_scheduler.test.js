import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { runOrderedWithConcurrency } from '../src/services/execution_scheduler.js';

const consultaSource = readFileSync(
  new URL('../src/pages/consulta.astro', import.meta.url),
  'utf8',
);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test('inicia el siguiente servicio apenas se libera capacidad, sin esperar todo el lote', async () => {
  const events = [];
  const jobs = [
    async () => { events.push('start-1'); await delay(70); events.push('end-1'); return 1; },
    async () => { events.push('start-2'); await delay(10); events.push('end-2'); return 2; },
    async () => { events.push('start-3'); await delay(5); events.push('end-3'); return 3; },
  ];
  const result = await runOrderedWithConcurrency(jobs, 2);
  assert.ok(events.indexOf('start-3') < events.indexOf('end-1'));
  assert.deepEqual(result.map(item => item.status), ['fulfilled', 'fulfilled', 'fulfilled']);
});

test('conserva el orden de resultados y aísla fallos entre secciones', async () => {
  const result = await runOrderedWithConcurrency([
    async () => 'uno',
    async () => { throw new Error('portal caído'); },
    async () => 'tres',
  ], 2);
  assert.equal(result[0].value, 'uno');
  assert.equal(result[1].status, 'rejected');
  assert.equal(result[2].value, 'tres');
});

test('SUNARP lento no impide que SOAT y CITV queden listos primero', async () => {
  const events = [];
  const sunarp = (async () => { await delay(70); events.push('sunarp-ready'); })();
  const fast = runOrderedWithConcurrency([
    async () => { await delay(5); events.push('soat-ready'); },
    async () => { await delay(8); events.push('citv-ready'); },
  ], 2);
  await fast;
  assert.deepEqual(events, ['soat-ready', 'citv-ready']);
  await sunarp;
  assert.equal(events.at(-1), 'sunarp-ready');
});

test('SBS caído queda aislado y no detiene la siguiente fuente', async () => {
  const result = await runOrderedWithConcurrency([
    async () => { throw new Error('SBS no disponible'); },
    async () => 'historial-listo',
  ], 1);
  assert.equal(result[0].status, 'rejected');
  assert.equal(result[1].value, 'historial-listo');
});

test('el modal solo se oculta desde la resolución terminal de SUNARP', () => {
  const sunarpStart = consultaSource.indexOf('const sunarpPromise =');
  const sunarpReady = consultaSource.indexOf('const sunarpReadyPromise = sunarpPromise.then', sunarpStart);
  const hideAfterStart = consultaSource.indexOf('hideLoadingOverlay();', sunarpStart);

  assert.ok(sunarpStart >= 0, 'debe iniciar SUNARP como promesa independiente');
  assert.ok(sunarpReady > sunarpStart, 'debe enlazar el cierre al resultado SUNARP');
  assert.ok(hideAfterStart > sunarpReady, 'no debe ocultar el modal antes de SUNARP');
  assert.match(consultaSource, /const sunarpResult = await sunarpReadyPromise;/);
});

test('CITV conserva un reintento completo si el proveedor agota su primer presupuesto', () => {
  assert.match(
    consultaSource,
    /runFetchWithRetry\('citv',[\s\S]*?plate, 1, 2\);/,
  );
});

test('las fuentes variables no bloquean el inicio de las secciones avanzadas', () => {
  const backgroundStart = consultaSource.indexOf('const variableSectionsPromise = runInBatches');
  const advancedStart = consultaSource.indexOf('ADVANCED_EXECUTION_ORDER.map((sectionId)', backgroundStart);
  const backgroundJoin = consultaSource.indexOf('await variableSectionsPromise;', advancedStart);

  assert.ok(backgroundStart >= 0);
  assert.ok(advancedStart > backgroundStart);
  assert.ok(backgroundJoin > advancedStart);
});

test('las secciones avanzadas usan dos carriles y modo protegido usa solo uno', () => {
  assert.match(
    consultaSource,
    /const advancedConcurrency = admission\?\.load_mode === 'protected' \? 1 : 2;/,
  );
  assert.match(
    consultaSource,
    /ADVANCED_EXECUTION_ORDER\.map\(\(sectionId\)[\s\S]*?advancedConcurrency,[\s\S]*?'sección avanzada'/,
  );
});

test('FISE reintenta una validación no concluyente y nunca depende de un solo token', () => {
  assert.match(
    consultaSource,
    /runFetchWithRetry\('fise',[\s\S]*?plate, 1, 2\);/,
  );
});
