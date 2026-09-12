import test from 'node:test';
import assert from 'node:assert/strict';

import { runFetchSATCaptura, runFetchSATDeposito } from '../src/services/api.js';

const callbacks = () => ({
  setCardLoading() {},
  setCardData() {},
  setCardError() {},
});

test('SAT automático combinado consulta una vez y preserva ambos resultados', async () => {
  const previousFetch = globalThis.fetch;
  const calls = [];
  const data = {
    success: true,
    captura: { success: true, tiene: false, outcome: 'CONFIRMED_NEGATIVE' },
    deposito: { success: true, internado: false, outcome: 'CONFIRMED_NEGATIVE' },
  };
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const result = await runFetchSATCaptura('AVW604', 'https://backend.test/api/v1', callbacks(), { combined: true });
    assert.equal(calls.length, 1);
    assert.match(calls[0], /\/sat\/AVW604$/);
    assert.equal(result.captura.success, true);
    assert.equal(result.deposito.success, true);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('SAT Depósito renderiza el resultado combinado sin un segundo GET', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('No debe realizar un segundo GET'); };
  const rendered = [];
  const prefetched = {
    captura: { success: true, tiene: false },
    deposito: { success: true, internado: false, outcome: 'CONFIRMED_NEGATIVE' },
  };
  try {
    const result = await runFetchSATDeposito('AVW604', 'https://backend.test/api/v1', {
      setCardLoading() {},
      setCardData(id) { rendered.push(id); },
      setCardError() {},
    }, prefetched);
    assert.equal(result.deposito.success, true);
    assert.deepEqual(rendered, ['sat_deposito']);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('SAT manual Captura conserva su endpoint individual', async () => {
  const previousFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify({
      success: true,
      captura: { success: true, tiene: false },
      deposito: null,
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  try {
    await runFetchSATCaptura('AVW604', 'https://backend.test/api/v1', callbacks());
    assert.match(calls[0], /\/sat\/captura\/AVW604$/);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('CAPTCHA_EXHAUSTED conserva metadata y Depósito combinado para política y cache', async () => {
  const previousFetch = globalThis.fetch;
  const errors = [];
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: true,
    captura: { success: false, code: 'SAT_CAPTCHA_EXHAUSTED', outcome: 'CAPTCHA_EXHAUSTED', error: 'Captcha no validado' },
    deposito: { success: true, internado: false, outcome: 'CONFIRMED_NEGATIVE' },
  }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    const result = await runFetchSATCaptura('AVW604', 'https://backend.test/api/v1', {
      setCardLoading() {},
      setCardData() {},
      setCardError(...args) { errors.push(args); },
    }, { combined: true });
    assert.equal(result.success, false);
    assert.equal(result.deposito.success, true);
    assert.equal(errors.length, 1);
    assert.equal(errors[0][8].outcome, 'CAPTCHA_EXHAUSTED');
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test('SAT timeout combinado conserva el contrato estructurado hasta la política de retry', async () => {
  const previousFetch = globalThis.fetch;
  const errors = [];
  globalThis.fetch = async () => new Response(JSON.stringify({
    success: false, code: 'SAT_TIMEOUT', outcome: 'TIMEOUT', timeout: true,
    captura: null, deposito: null, error: 'SAT agotó su tiempo',
  }), { status: 200, headers: { 'content-type': 'application/json', 'X-Provider-Status': 'timeout' } });
  try {
    const result = await runFetchSATCaptura('AVW604', 'https://backend.test/api/v1', {
      setCardLoading() {}, setCardData() {}, setCardError(...args) { errors.push(args); },
    }, { combined: true });
    assert.equal(result.code, 'SAT_TIMEOUT');
    assert.equal(errors[0][8].providerStatus, 'timeout');
  } finally { globalThis.fetch = previousFetch; }
});

test('scheduler automático usa SAT combinado y Depósito prefetched únicamente en fase avanzada', async () => {
  const source = await import('node:fs/promises').then(fs => fs.readFile(new URL('../src/pages/consulta.astro', import.meta.url), 'utf8'));
  assert.match(source, /sat_captura:\s*\(\)\s*=>\s*fetchSATCombinedAuto\(plate\)/);
  assert.match(source, /sat_deposito:\s*\(\)\s*=>\s*fetchSATDeposito\(plate, true\)/);
  assert.match(source, /async function fetchSATDeposito\(plate: string, usePrefetched: boolean = false\)/);
});
