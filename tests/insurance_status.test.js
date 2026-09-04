import test from 'node:test';
import assert from 'node:assert/strict';

import { parseDateDDMMYYYY } from '../src/utils/renderers.js';
import { runFetchSOAT } from '../src/services/providers/insurance.js';

function callbacksFor(capture) {
  return {
    setCardLoading() {},
    processVehicleInfo() {},
    setCardError(...args) { capture.error = args; },
    setCardData(...args) { capture.data = args; },
  };
}

async function withSoatResponse(rows, callback) {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true, data: rows }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  try {
    await callback();
  } finally {
    globalThis.fetch = previousFetch;
  }
}

test('una fecha vacía no se convierte silenciosamente en 1970', () => {
  assert.equal(Number.isNaN(parseDateDDMMYYYY('').getTime()), true);
  assert.equal(Number.isNaN(parseDateDDMMYYYY('31/02/2026').getTime()), true);
  assert.equal(parseDateDDMMYYYY('2017-01-20').getFullYear(), 2017);
});

test('SOAT usa FechaFinS cuando FechaFin no viene informada', async () => {
  const capture = {};
  await withSoatResponse([{ FechaFinS: '31/12/2099' }], async () => {
    await runFetchSOAT('A12346', 'https://backend.test', callbacksFor(capture));
  });
  assert.match(capture.data.at(-1), /VIGENTE/);
  assert.doesNotMatch(capture.data.at(-1), /20700/);
});

test('SOAT sin fecha ni estado muestra vigencia no informada', async () => {
  const capture = {};
  await withSoatResponse([{ Placa: 'A12346' }], async () => {
    await runFetchSOAT('A12346', 'https://backend.test', callbacksFor(capture));
  });
  assert.match(capture.data.at(-1), /VIGENCIA NO INFORMADA/);
  assert.doesNotMatch(capture.data.at(-1), /VENCIDO/);
});

test('SOAT con fecha ISO muestra antigüedad real y nunca la época Unix', async () => {
  const capture = {};
  await withSoatResponse([{ FechaFinS: '2017-01-20' }], async () => {
    await runFetchSOAT('A12346', 'https://backend.test', callbacksFor(capture));
  });
  assert.match(capture.data.at(-1), /VENCIDO \(hace \d+ años/);
  assert.doesNotMatch(capture.data.at(-1), /20700/);
});
