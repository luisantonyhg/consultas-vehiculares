import test from 'node:test';
import assert from 'node:assert/strict';

import { renderSBS } from '../src/utils/renderers/infracciones.js';
import { runFetchSBS } from '../src/services/providers/official_portals.js';


test('Siniestralidad usa tabla responsive y colorea la columna oficial de accidentes', () => {
  const html = renderSBS({
    soat: {
      tipo: 'SOAT',
      data: [{ 'Compañía aseguradora': 'Empresa A', 'N.° de accidentes': '0' }],
      total_accidentes: 0,
      error: null,
    },
    cat: {
      tipo: 'CAT',
      data: [{ 'Compañía aseguradora': 'Empresa B', 'N.° de accidentes': '2' }],
      total_accidentes: 2,
      error: null,
    },
  }, 'AVJ668');

  assert.match(html, /overflow-x-auto/);
  assert.match(html, /<table/);
  assert.doesNotMatch(html, /<article/);
  assert.match(html, /border-emerald-300/);
  assert.match(html, /border-red-300/);
});


test('una póliza sin total oficial no se cuenta falsamente como siniestro', async () => {
  const originalFetch = globalThis.fetch;
  let badge = '';
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({
      success: true,
      soat: { tipo: 'SOAT', data: [{ compañía: 'A' }], total_accidentes: null, error: null },
      vehicular: null,
      cat: null,
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    await runFetchSBS('AVJ668', 'https://backend.test', {
      setCardLoading() {},
      setCardError() { assert.fail('no debe fallar'); },
      setCardData(...args) { badge = args[9]; },
    });

    assert.doesNotMatch(badge, /1 SINIESTRO/);
    assert.match(badge, /PARCIAL/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test('tipos verificados sin filas ni accidentes producen badge verde, no parcial', async () => {
  const originalFetch = globalThis.fetch;
  let badge = '';
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({
      success: true,
      soat: {
        tipo: 'SOAT',
        data: [{ compañía: 'Pacífico' }, { compañía: 'La Positiva' }],
        total_accidentes: 0,
        error: null,
      },
      vehicular: { tipo: 'Vehicular', data: [], sin_registros: true, total_accidentes: null, error: null },
      cat: { tipo: 'CAT', data: [], sin_registros: true, total_accidentes: null, error: null },
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    await runFetchSBS('BZV409', 'https://backend.test', {
      setCardLoading() {},
      setCardError() { assert.fail('no debe fallar'); },
      setCardData(...args) { badge = args[9]; },
    });

    assert.match(badge, /SIN SINIESTROS/);
    assert.doesNotMatch(badge, /PARCIAL|SIN TOTAL OFICIAL/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
