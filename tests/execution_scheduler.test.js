import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { runOrderedWithConcurrency, runSectionsWithDependencies } from '../src/services/execution_scheduler.js';
import { buildAdvancedNodes } from '../src/services/execution_plan.js';

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
  const advancedStart = consultaSource.indexOf('const advancedPromise = runSectionsWithDependencies(', backgroundStart);
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
    /runSectionsWithDependencies\(\s*advancedNodes\.map\(\(node[\s\S]*?advancedConcurrency,/,
  );
});

test('P0.4.1: fase avanzada usa scheduling por sección con dependencias', () => {
  // NUNCA un lane-cadena reteniendo un worker: cada sección libera su slot.
  const nodesPos = consultaSource.indexOf('const advancedNodes = buildAdvancedNodes(standardAdvancedOrder);');
  assert.ok(nodesPos >= 0, 'los nodos derivan del orden estándar sin historial');
  assert.match(
    consultaSource,
    /const advancedPromise = runSectionsWithDependencies\(\s*advancedNodes\.map\(\(node/,
  );
  assert.ok(!consultaSource.includes('advancedLanes.map((entry'), 'sin lanes que reserven workers');
});

test('P0.3: el batch avanzado deriva de ADVANCED_EXECUTION_ORDER sin historial', () => {
  // El orden canónico no se reescribe; historial sale a carril propio.
  assert.match(
    consultaSource,
    /splitPrioritySections\(\s*ADVANCED_EXECUTION_ORDER,\s*\['historial_dueños'\]/,
  );
  assert.match(
    consultaSource,
    /const historialPromise = runSectionSafely\('historial_dueños'/,
  );
  // Ambas ramas se esperan antes del score; ninguna cancela a la otra.
  const scorePos = consultaSource.indexOf('renderVehicleScore(plate);');
  assert.ok(consultaSource.indexOf('await historialPromise;', scorePos - 600) >= 0);
});

test('FISE reintenta una validación no concluyente y nunca depende de un solo token', () => {
  assert.match(
    consultaSource,
    /runFetchWithRetry\('fise',[\s\S]*?plate, 1, 2\);/,
  );
});

test('P0.4: carriles comparten el pool sin exceder concurrencia y con orden interno', async () => {
  // Nota P0.4.1: runSectionsWithDependencies reemplaza los lane-jobs que
  // retenían workers; este test conserva la verificación del pool clásico.
  const events = [];
  let live = 0;
  let peak = 0;
  const durations = { soat: 30, sbs: 10, sat_captura: 30, sat_deposito: 10, atu: 5, sigm: 5, lima: 5, municipal: 5 };
  const sections = ['soat', 'sat_captura', 'sigm', 'lima', 'municipal', 'sbs', 'sat_deposito'];
  const jobs = sections.map(sectionId => async () => {
    live++;
    peak = Math.max(peak, live);
    events.push(`start-${sectionId}`);
    await delay(durations[sectionId] ?? 5);
    events.push(`end-${sectionId}`);
    live--;
  });
  await runOrderedWithConcurrency(jobs, 2);
  assert.ok(peak <= 2, `pico de concurrencia ${peak} excede el pool`);
  for (const id of sections) {
    assert.ok(events.includes(`start-${id}`), `falta ${id}`);
  }
});

test('P0.4.1 CRÍTICO: singles no esperan cadenas completas; pico <= 2 secciones', async () => {
  // SOAT=SBS=SAT_CAP=SAT_DEP=100ms, LIMA=MUNICIPAL=10ms, conc=2.
  // Con lanes-cadena, lima/municipal esperarían ~200ms; por sección no.
  const events = [];
  let live = 0;
  let peak = 0;
  const durations = {
    soat: 100, sbs: 100, sat_captura: 100, sat_deposito: 100,
    lima: 10, municipal: 10,
  };
  const nodes = [
    { id: 'soat', deps: [], run: null },
    { id: 'sat_captura', deps: [], run: null },
    { id: 'lima', deps: [], run: null },
    { id: 'municipal', deps: [], run: null },
    { id: 'sbs', deps: ['soat'], run: null },
    { id: 'sat_deposito', deps: ['sat_captura'], run: null },
  ].map(node => ({
    ...node,
    run: async () => {
      live++;
      peak = Math.max(peak, live);
      events.push(`start-${node.id}`);
      await delay(durations[node.id]);
      events.push(`end-${node.id}`);
      live--;
    },
  }));
  const startedAt = Date.now();
  const { results, peakActiveSections } = await runSectionsWithDependencies(nodes, 2);
  assert.ok(peak <= 2, `pico de secciones ${peak} excede el máximo`);
  assert.ok(peakActiveSections <= 2);
  assert.ok(events.indexOf('end-soat') < events.indexOf('start-sbs'), 'SBS solo tras SOAT');
  assert.ok(events.indexOf('end-sat_captura') < events.indexOf('start-sat_deposito'), 'Depósito solo tras Captura');
  // Fairness: lima/municipal arrancan sin esperar las 4 operaciones largas.
  const latestLongEnd = Math.max(events.indexOf('end-sbs'), events.indexOf('end-sat_deposito'));
  assert.ok(events.indexOf('start-lima') < latestLongEnd, 'lima no espera cadenas completas');
  assert.ok(events.indexOf('start-municipal') < latestLongEnd, 'municipal no espera cadenas completas');
  assert.ok(Date.now() - startedAt < 1000, 'sin cuelgues');
  for (const id of Object.keys(durations)) {
    assert.equal(results[id].status, 'fulfilled');
  }
});

test('P0.4.1: dependencias imposibles no cuelgan el scheduler', async () => {
  const { results } = await runSectionsWithDependencies([
    { id: 'a', deps: ['fantasma'], run: async () => 'a' },
    { id: 'b', deps: [], run: async () => 'b' },
  ], 2);
  assert.equal(results.b.status, 'fulfilled');
  assert.equal(results.a.status, 'skipped');
});

test('P0.4.1: un fallo aísla sin bloquear dependientes ni colgar', async () => {
  const events = [];
  const { results } = await runSectionsWithDependencies([
    { id: 'soat', deps: [], run: async () => { throw new Error('SOAT caído'); } },
    { id: 'sbs', deps: ['soat'], run: async () => { events.push('sbs-intenta'); return 'sbs'; } },
  ], 2);
  assert.equal(results.soat.status, 'rejected');
  assert.equal(results.sbs.status, 'fulfilled');
  assert.deepEqual(events, ['sbs-intenta']);
});
